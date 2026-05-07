import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { ExamDTO, QuestionDTO, AnswerDTO } from '../../models/models';

// État de sauvegarde par index
interface SaveState { saving: boolean; saved: boolean; error: boolean; }

@Component({
  selector: 'app-exam-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  templateUrl: './exam-form.component.html',
  styleUrls: ['./exam-form.component.css']
})
export class ExamFormComponent implements OnInit {
  isEdit = false;
  loading = false;
  saving = false;
  error = '';
  success = '';

  exam: ExamDTO = {
    description: '',
    status: 'CREATED',
    numberOfQuestions: 0,
    questionDTOList: []
  };

  // États individuels pour chaque question et réponse
  questionStates: { [qi: number]: SaveState } = {};
  answerStates: { [key: string]: SaveState } = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    public auth: AuthService
  ) {}

  ngOnInit() {
    const codeExam = this.route.snapshot.paramMap.get('codeExam');
    if (codeExam && codeExam !== 'new') {
      this.isEdit = true;
      this.loading = true;
      this.api.getExam(codeExam).subscribe({
        next: exam => { this.exam = exam; this.loading = false; },
        error: () => { this.error = 'Examen introuvable'; this.loading = false; }
      });
    }
  }

  // ── QUESTIONS ──────────────────────────────────────────

  addQuestion() {
    if (!this.exam.questionDTOList) this.exam.questionDTOList = [];
    this.exam.questionDTOList.push({
      questionContent: '',
      description: '',
      answers: [
        { answerContent: '', answerStatus: 'CORRECT', description: '' },
        { answerContent: '', answerStatus: 'WRONG', description: '' }
      ]
    });
  }

  removeQuestion(index: number) {
    this.exam.questionDTOList?.splice(index, 1);
  }

  /** Enregistre une nouvelle question (POST) */
  saveQuestion(question: QuestionDTO, qi: number) {
    this.questionStates[qi] = { saving: true, saved: false, error: false };
    const payload: QuestionDTO = {
      ...question,
      examId: this.exam.codeExam
    };
    this.api.saveQuestionAndAnswers(payload).subscribe({
      next: saved => {
        question.codeQuestion = saved.codeQuestion; // Récupère le code généré
        this.questionStates[qi] = { saving: false, saved: true, error: false };
        setTimeout(() => { if (this.questionStates[qi]) this.questionStates[qi].saved = false; }, 2500);
      },
      error: () => {
        this.questionStates[qi] = { saving: false, saved: false, error: true };
      }
    });
  }

  /** Met à jour une question existante (PUT) */
  updateQuestion(question: QuestionDTO, qi: number) {
    if (!question.codeQuestion) { this.saveQuestion(question, qi); return; }
    this.questionStates[qi] = { saving: true, saved: false, error: false };
    this.api.updateQuestionWithAnswers(question.codeQuestion, question).subscribe({
      next: () => {
        this.questionStates[qi] = { saving: false, saved: true, error: false };
        setTimeout(() => { if (this.questionStates[qi]) this.questionStates[qi].saved = false; }, 2500);
      },
      error: () => {
        this.questionStates[qi] = { saving: false, saved: false, error: true };
      }
    });
  }

  // ── RÉPONSES ───────────────────────────────────────────

  addAnswer(question: QuestionDTO) {
    if (!question.answers) question.answers = [];
    question.answers.push({ answerContent: '', answerStatus: 'WRONG', description: '' });
  }

  removeAnswer(question: QuestionDTO, index: number) {
    question.answers?.splice(index, 1);
  }

  answerKey(qi: number, ai: number): string { return `${qi}_${ai}`; }

  getQuestionState(qi: number): SaveState {
    return this.questionStates[qi] ?? { saving: false, saved: false, error: false };
  }

  getAnswerState(qi: number, ai: number): SaveState {
    return this.answerStates[this.answerKey(qi, ai)] ?? { saving: false, saved: false, error: false };
  }

  /** Enregistre une nouvelle réponse (POST) */
  saveAnswer(answer: AnswerDTO, question: QuestionDTO, qi: number, ai: number) {
    const key = this.answerKey(qi, ai);
    this.answerStates[key] = { saving: true, saved: false, error: false };
    const payload: AnswerDTO = { ...answer, questionId: question.codeQuestion };
    this.api.saveAnswer(payload).subscribe({
      next: saved => {
        answer.codeAnswer = saved.codeAnswer;
        this.answerStates[key] = { saving: false, saved: true, error: false };
        setTimeout(() => { if (this.answerStates[key]) this.answerStates[key].saved = false; }, 2500);
      },
      error: () => { this.answerStates[key] = { saving: false, saved: false, error: true }; }
    });
  }

  /** Met à jour une réponse existante (PUT) */
  updateAnswer(answer: AnswerDTO, qi: number, ai: number) {
    if (!answer.codeAnswer) return;
    const key = this.answerKey(qi, ai);
    this.answerStates[key] = { saving: true, saved: false, error: false };
    this.api.updateAnswer(answer.codeAnswer, answer).subscribe({
      next: () => {
        this.answerStates[key] = { saving: false, saved: true, error: false };
        setTimeout(() => { if (this.answerStates[key]) this.answerStates[key].saved = false; }, 2500);
      },
      error: () => { this.answerStates[key] = { saving: false, saved: false, error: true }; }
    });
  }

  // ── EXAMEN (infos générales) ───────────────────────────

  onSubmit() {
    this.saving = true;
    this.error = '';
    const userId = (this.auth.currentUser as any)?.id;

    if (this.isEdit) {
      this.api.updateExam(this.exam.codeExam!, this.exam).subscribe({
        next: () => { this.success = 'Examen mis à jour !'; this.saving = false; },
        error: () => { this.error = 'Erreur lors de la mise à jour.'; this.saving = false; }
      });
    } else {
      this.api.saveExamAllQuestionsAndAnswers(userId, this.exam).subscribe({
        next: saved => {
          this.success = 'Examen créé avec succès !';
          this.saving = false;
          setTimeout(() => this.router.navigate(['/exams', saved.codeExam]), 1000);
        },
        error: () => { this.error = 'Erreur lors de la création.'; this.saving = false; }
      });
    }
  }
}
