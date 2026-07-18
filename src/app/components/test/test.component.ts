import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../navbar/navbar.component';
import { ApiService } from '../../services/api.service';
import { TestStateService } from '../../services/test-state.service';
import { TestExamDTO, QuestionDTO, AnswerDTO, TestResultDTO } from '../../models/models';
import { LangService } from "../../services/lang.service";
import { MathJaxService } from '../../services/mathjax.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-test',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.css']
})
export class TestComponent implements OnInit, OnDestroy {
  testExam: TestExamDTO | null = null;
  questions: QuestionDTO[] = [];
  selectedAnswers: { [questionIndex: number]: number[] } = {};
  loading = true;
  submitting = false;
  error = '';
  userId = 0;
  codeExam = '';

  // ── Navigation question par question ──────────────────────
  currentQuestionIndex = 0;

  // ── Minuteur ─────────────────────────────────────────────
  hasTimer = false;
  totalSeconds = 0;
  remainingSeconds = 0;
  timeExpired = false;
  private timerInterval: any = null;
  private halfTimeWarned = false;
  private endWarned = false;
  private endWarningThresholdSeconds = 60;

  constructor(
      private route: ActivatedRoute,
      private router: Router,
      public api: ApiService,
      private testState: TestStateService,
      public lang: LangService,
      private mathJax: MathJaxService,
      private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.userId = +params['userId'];
      this.codeExam = params['codeExam'];

      this.api.getTestExam({ userId: this.userId, codeExam: this.codeExam }).subscribe({
        next: (testExam: TestExamDTO) => {
          this.testExam = testExam;
          this.questions = testExam.examDTO?.questionDTOList || [];
          this.questions.forEach((_, idx) => {
            this.selectedAnswers[idx] = [];
          });
          this.currentQuestionIndex = 0;
          this.loading = false;
          this.initTimer(testExam);
        },
        error: (err) => {
          if (err.status === 403 && err.error?.includes('3 tentatives')) {
            this.error = this.lang.t('test.limit_reached');
            Swal.fire({
              icon: 'warning',
              title: this.lang.t('test.limit_reached_title'),
              text: this.lang.t('test.limit_reached_text'),
              confirmButtonText: 'OK'
            }).then(() => this.router.navigate(['/dashboard']));
          } else {
            this.error = this.lang.t('test.error');
          }
          this.loading = false;
        }
      });
    });
  }

  ngOnDestroy() {
    this.clearTimer();
  }

  // ── NAVIGATION ENTRE QUESTIONS ─────────────────────────────

  get currentQuestion(): QuestionDTO | null {
    return this.questions[this.currentQuestionIndex] ?? null;
  }

  goToQuestion(index: number) {
    if (index >= 0 && index < this.questions.length) {
      this.currentQuestionIndex = index;
    }
  }

  nextQuestion() {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
    }
  }

  prevQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
    }
  }

  isQuestionAnswered(qi: number): boolean {
    return (this.selectedAnswers[qi]?.length ?? 0) > 0;
  }

  // ── MINUTEUR ─────────────────────────────────────────────

  private initTimer(testExam: TestExamDTO) {
    const duration = testExam.examDTO?.durationMinutes;
    if (!duration || duration <= 0) {
      this.hasTimer = false;
      return;
    }

    this.hasTimer = true;
    this.totalSeconds = duration * 60;
    this.remainingSeconds = this.totalSeconds;

    this.endWarningThresholdSeconds = this.totalSeconds >= 600
        ? 300
        : Math.max(30, Math.round(this.totalSeconds * 0.15));

    this.timerInterval = setInterval(() => this.tick(), 1000);
  }

  private tick() {
    if (this.remainingSeconds <= 0) {
      this.onTimeExpired();
      return;
    }

    this.remainingSeconds--;

    if (!this.halfTimeWarned && this.remainingSeconds <= Math.floor(this.totalSeconds / 2)) {
      this.halfTimeWarned = true;
      this.showHalfTimeWarning();
    }

    if (!this.endWarned && this.remainingSeconds <= this.endWarningThresholdSeconds) {
      this.endWarned = true;
      this.showEndWarning();
    }

    if (this.remainingSeconds <= 0) {
      this.onTimeExpired();
    }
  }

  private clearTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private showHalfTimeWarning() {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'info',
      title: this.lang.t('test.half_time_warning'),
      text: this.formatTime(this.remainingSeconds) + ' ' + this.lang.t('test.remaining'),
      showConfirmButton: false,
      timer: 5000
    });
  }

  private showEndWarning() {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'warning',
      title: this.lang.t('test.end_warning'),
      text: this.formatTime(this.remainingSeconds) + ' ' + this.lang.t('test.remaining'),
      showConfirmButton: false,
      timer: 6000
    });
  }

  private onTimeExpired() {
    this.clearTimer();
    if (this.timeExpired || this.submitting) return;
    this.timeExpired = true;

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: this.lang.t('test.time_up_title'),
      text: this.lang.t('test.time_up_text'),
      showConfirmButton: false,
      timer: 4000
    });

    this.sendTestToBackend();
  }

  formatTime(totalSeconds: number): string {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  get timerClass(): string {
    if (!this.hasTimer) return '';
    if (this.remainingSeconds <= this.endWarningThresholdSeconds) return 'timer-critical';
    if (this.remainingSeconds <= Math.floor(this.totalSeconds / 2)) return 'timer-warning';
    return 'timer-normal';
  }

  // ── QUESTIONS / RÉPONSES ──────────────────────────────────

  getAnswerLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  toggleAnswer(qIndex: number, aIndex: number) {
    if (this.timeExpired) return;
    const current = this.selectedAnswers[qIndex];
    if (current.includes(aIndex)) {
      this.selectedAnswers[qIndex] = current.filter(i => i !== aIndex);
    } else {
      this.selectedAnswers[qIndex] = [...current, aIndex];
    }
  }

  isSelected(qIndex: number, aIndex: number): boolean {
    return this.selectedAnswers[qIndex]?.includes(aIndex) ?? false;
  }

  get answeredCount(): number {
    return Object.values(this.selectedAnswers).filter(arr => arr.length > 0).length;
  }

  get progress(): number {
    if (this.questions.length === 0) return 0;
    return Math.round((this.answeredCount / this.questions.length) * 100);
  }

  get allAnswered(): boolean {
    return this.answeredCount === this.questions.length;
  }

  submitTest() {
    if (!this.allAnswered) {
      Swal.fire({
        icon: 'warning',
        title: this.lang.t('test.incomplete_title'),
        text: this.lang.t('test.incomplete_text'),
        confirmButtonText: this.lang.t('test.continue'),
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    Swal.fire({
      title: this.lang.t('test.confirm_submit_title'),
      html: `${this.lang.t('test.confirm_submit_text')} <strong>${this.questions.length}</strong> ${this.lang.t('test.questions_count')}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: this.lang.t('test.confirm_submit_confirm'),
      cancelButtonText: this.lang.t('test.confirm_submit_cancel'),
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#64748b',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.sendTestToBackend();
      }
    });
  }

  sendTestToBackend() {
    if (this.submitting) return;
    this.submitting = true;
    this.error = '';
    this.clearTimer();

    const answeredQuestions: QuestionDTO[] = this.questions.map((q, qi) => {
      const selectedIndices = this.selectedAnswers[qi] || [];

      const answersWithStatus: AnswerDTO[] = (q.answers || []).map((a, ai) => ({
        codeAnswer: a.codeAnswer,
        answerContent: a.answerContent,
        answerStatus: selectedIndices.includes(ai) ? 'CORRECT' : 'WRONG',
        description: a.description,
        questionId: q.codeQuestion
      }));

      return {
        codeQuestion: q.codeQuestion,
        questionContent: q.questionContent,
        description: q.description,
        examId: q.examId,
        answers: answersWithStatus
      };
    });

    const payload = {
      userId: this.userId,
      codeExam: this.codeExam,
      questionDTOS: answeredQuestions
    };

    this.testState.setSubmittedQuestions(answeredQuestions);

    this.api.sendTest(payload).subscribe({
      next: (result: TestResultDTO) => {
        this.testState.setTestResult(result);
        this.submitting = false;

        if (!this.timeExpired) {
          Swal.fire({
            icon: 'success',
            title: this.lang.t('test.success'),
            text: this.lang.t('test.success_message'),
            timer: 2000,
            showConfirmButton: false,
            position: 'top-end'
          });
        }

        this.router.navigate(['/test-result']);
      },
      error: (err) => {
        console.error('=== ERREUR BACKEND ===', err);
        this.submitting = false;

        Swal.fire({
          icon: 'error',
          title: this.lang.t('test.error'),
          text: this.lang.t('test.error_message'),
          confirmButtonText: this.lang.t('test.close'),
          confirmButtonColor: '#dc2626'
        });
      }
    });
  }

  // ── Rendu mathématique ──────────────────────────────────
  renderMath(text: string | undefined | null): SafeHtml {
    if (!text) return this.sanitizer.bypassSecurityTrustHtml('');
    return this.mathJax.renderTextWithMath(text);
  }

  // ── Pièces jointes ───────────────────────────────────────
  getAttachmentIcon(type?: string): string {
    switch (type) {
      case 'PDF':   return '📄';
      case 'WORD':  return '📝';
      case 'IMAGE': return '🖼️';
      case 'VIDEO': return '🎬';
      case 'AUDIO': return '🎵';
      default:      return '📎';
    }
  }
}