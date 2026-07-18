import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ApiService, GenerateQuestionsRequest } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { LangService } from '../../services/lang.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { MathEditorComponent } from '../math-editor/math-editor.component';
import { ExamDTO, QuestionDTO, AttachmentType } from '../../models/models';

interface SaveState {
  saving: boolean;
  saved: boolean;
  error: boolean;
}

@Component({
  selector: 'app-exam-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NavbarComponent,
    MathEditorComponent
  ],
  templateUrl: './exam-form.component.html',
  styleUrls: ['./exam-form.component.css']
})
export class ExamFormComponent implements OnInit {
  isEdit = false;
  loading = false;
  saving = false;
  error = '';
  success = '';
  hasDuration = false;
  currentQuestionIndex = 0;

  exam: ExamDTO = {
    description: '',
    status: 'CREATED',
    visibility: 'PRIVATE',
    numberOfQuestions: 0,
    questionDTOList: []
  };

  // État de l'upload de pièce jointe uniquement (par question)
  attachmentStates: { [qi: number]: SaveState } = {};

  readonly acceptedAttachmentTypes = '.pdf,.doc,.docx,image/*,video/*,audio/*';
  readonly maxAttachmentSizeMb = 50;

  // ==================== GÉNÉRATION IA ====================
  showAiModal = false;
  aiGenerating = false;
  aiError = '';
  aiRequest: GenerateQuestionsRequest = {
    subject: '',
    level: '',
    numberOfQuestions: 5,
    language: 'fr',
    allowMultipleCorrectAnswers: true,
    difficulty: 'MOYEN'
  };
  aiFile: File | null = null;
  readonly acceptedAiFileTypes = '.pdf,.docx,.txt';
  readonly maxAiFileSizeMb = 10;

  constructor(
      private route: ActivatedRoute,
      private router: Router,
      private api: ApiService,
      public auth: AuthService,
      public lang: LangService
  ) {}

  ngOnInit() {
    const codeExam = this.route.snapshot.paramMap.get('codeExam');
    if (codeExam && codeExam !== 'new') {
      this.isEdit = true;
      this.loading = true;
      this.api.getExam(codeExam).subscribe({
        next: exam => {
          this.exam = exam;
          this.currentQuestionIndex = 0;
          this.hasDuration = exam.durationMinutes != null && exam.durationMinutes > 0;
          this.loading = false;
        },
        error: () => {
          this.error = 'Examen introuvable';
          this.loading = false;
        }
      });
    }
  }

  onToggleDuration() {
    if (!this.hasDuration) {
      this.exam.durationMinutes = undefined;
    } else if (!this.exam.durationMinutes) {
      this.exam.durationMinutes = 60; // valeur par défaut : 60 minutes
    }
  }

  // ── QUESTIONS ──────────────────────────────────────────

  addQuestion() {
    if (!this.exam.questionDTOList) this.exam.questionDTOList = [];
    this.exam.questionDTOList.push({
      questionContent: '',
      description: '',
      answers: [
        { answerContent: '', answerStatus: 'CORRECT', description: '' }
      ]
    });
    this.currentQuestionIndex = this.exam.questionDTOList.length - 1;
  }

  removeQuestion(index: number) {
    this.exam.questionDTOList?.splice(index, 1);
    const len = this.exam.questionDTOList?.length ?? 0;
    if (this.currentQuestionIndex >= len) {
      this.currentQuestionIndex = Math.max(0, len - 1);
    }
  }

  // ── PIÈCE JOINTE (document / vidéo / audio support de la question) ─────

  getAttachmentState(qi: number): SaveState {
    return this.attachmentStates[qi] ?? { saving: false, saved: false, error: false };
  }

  onFileSelected(event: Event, question: QuestionDTO, qi: number) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (file.size > this.maxAttachmentSizeMb * 1024 * 1024) {
      this.attachmentStates[qi] = { saving: false, saved: false, error: true };
      input.value = '';
      return;
    }

    this.attachmentStates[qi] = { saving: true, saved: false, error: false };

    this.api.uploadQuestionAttachment(file).subscribe({
      next: res => {
        question.attachmentUrl = res.url;
        question.attachmentType = res.type;
        question.attachmentName = res.name;
        this.attachmentStates[qi] = { saving: false, saved: true, error: false };
        setTimeout(() => {
          if (this.attachmentStates[qi]) this.attachmentStates[qi].saved = false;
        }, 2500);
      },
      error: () => {
        this.attachmentStates[qi] = { saving: false, saved: false, error: true };
      }
    });

    input.value = '';
  }

  removeAttachment(question: QuestionDTO) {
    question.attachmentUrl = undefined;
    question.attachmentType = undefined;
    question.attachmentName = undefined;
  }

  getAttachmentIcon(type?: AttachmentType): string {
    switch (type) {
      case 'PDF':   return '📄';
      case 'WORD':  return '📝';
      case 'IMAGE': return '🖼️';
      case 'VIDEO': return '🎬';
      case 'AUDIO': return '🎵';
      default:      return '📎';
    }
  }

  goToQuestion(index: number) {
    if (this.exam.questionDTOList && index >= 0 && index < this.exam.questionDTOList.length) {
      this.currentQuestionIndex = index;
    }
  }

  nextQuestion() {
    const len = this.exam.questionDTOList?.length ?? 0;
    if (this.currentQuestionIndex < len - 1) this.currentQuestionIndex++;
  }

  prevQuestion() {
    if (this.currentQuestionIndex > 0) this.currentQuestionIndex--;
  }

  isQuestionFilled(question: QuestionDTO): boolean {
    return !!question.questionContent?.trim();
  }

  // ── RÉPONSES ───────────────────────────────────────────

  addAnswer(question: QuestionDTO) {
    if (!question.answers) question.answers = [];
    question.answers.push({ answerContent: '', answerStatus: 'WRONG', description: '' });
  }

  removeAnswer(question: QuestionDTO, index: number) {
    question.answers?.splice(index, 1);
  }

  // ==================== GÉNÉRATION IA ====================

  openAiModal() {
    this.aiError = '';
    this.showAiModal = true;
  }

  closeAiModal() {
    if (this.aiGenerating) return; // évite de fermer pendant un appel en cours
    this.showAiModal = false;
  }

  onAiFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (file.size > this.maxAiFileSizeMb * 1024 * 1024) {
      this.aiError = this.lang.t('form.ai_file_too_large');
      input.value = '';
      return;
    }

    this.aiError = '';
    this.aiFile = file;
    input.value = '';
  }

  removeAiFile() {
    this.aiFile = null;
  }

  generateWithAi() {
    if (!this.aiRequest.subject || !this.aiRequest.subject.trim()) {
      this.aiError = this.lang.t('form.ai_subject_required');
      return;
    }

    this.aiGenerating = true;
    this.aiError = '';

    this.api.generateQuestionsWithAi(this.aiRequest, this.aiFile).subscribe({
      next: (questions) => {
        if (!this.exam.questionDTOList) this.exam.questionDTOList = [];
        const insertIndex = this.exam.questionDTOList.length;
        // Les questions générées n'ont pas de codeQuestion : elles seront créées
        // au moment du "Enregistrer" global, comme les questions ajoutées manuellement.
        this.exam.questionDTOList.push(...questions);
        this.currentQuestionIndex = insertIndex; // saute sur la 1ère question générée pour relecture
        this.aiGenerating = false;
        this.showAiModal = false;
        this.aiFile = null;
      },
      error: (err) => {
        this.aiGenerating = false;
        this.aiError = err.error?.message || this.lang.t('form.ai_error');
      }
    });
  }

  // ── ACTIONS GLOBALES ───────────────────────────────────

  onSubmit() {
    this.saving = true;
    this.error = '';
    const userId = this.auth.getCurrentUserId();

    if (this.isEdit) {
      this.api.updateExam(this.exam.codeExam!, this.exam).subscribe({
        next: () => {
          this.success = 'Examen mis à jour !';
          this.saving = false;
        },
        error: () => {
          this.error = 'Erreur lors de la mise à jour.';
          this.saving = false;
        }
      });
    } else {
      this.exam.userId = userId;
      this.exam.numberOfQuestions = this.exam.questionDTOList?.length || 0;
      this.exam.dateCreation = new Date().toISOString();

      this.api.saveExam(this.exam).subscribe({
        next: saved => {
          this.success = 'Examen créé avec succès !';
          this.saving = false;
          setTimeout(() => this.router.navigate(['/exams', saved.codeExam]), 1000);
        },
        error: () => {
          this.error = 'Erreur lors de la création.';
          this.saving = false;
        }
      });
    }
  }

  cancel() {
    this.router.navigate(['/exams']);
  }
}