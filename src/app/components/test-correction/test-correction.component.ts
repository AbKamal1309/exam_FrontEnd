import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { TestStateService } from '../../services/test-state.service';
import { ApiService } from '../../services/api.service';
import { QuestionDTO, AnswerDTO, AttachmentType } from '../../models/models';
import { LangService } from "../../services/lang.service";
import { MathJaxService } from '../../services/mathjax.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface AnswerCorrection {
    content: string;
    userStatus: 'CORRECT' | 'WRONG';
    actualStatus: 'CORRECT' | 'WRONG';
    isUserCorrect: boolean;
    isActuallyCorrect: boolean;
}

interface QuestionCorrection {
    content: string;
    answers: AnswerCorrection[];
    isFullyCorrect: boolean;
    correctAnswerContent: string;
    attachmentUrl?: string;
    attachmentType?: AttachmentType;
    attachmentName?: string;
}

@Component({
    selector: 'app-test-correction',
    standalone: true,
    imports: [CommonModule, NavbarComponent],
    templateUrl: './test-correction.component.html',
    styleUrls: ['./test-correction.component.css']
})
export class TestCorrectionComponent implements OnInit {
    corrections: QuestionCorrection[] = [];
    loading = true;
    error = '';

    constructor(
        private router: Router,
        private testState: TestStateService,
        public api: ApiService,
        public lang: LangService,
        private mathJax: MathJaxService,
        private sanitizer: DomSanitizer
    ) {}

    async ngOnInit() {
        const submittedQuestions = this.testState.getSubmittedQuestions();
        const testResult = this.testState.getTestResult();

        if (!submittedQuestions || submittedQuestions.length === 0) {
            this.error = 'Aucune donnée de correction disponible.';
            this.loading = false;
            return;
        }

        const examCode = testResult?.examId;
        if (!examCode) {
            this.error = 'Examen non trouvé.';
            this.loading = false;
            return;
        }

        try {
            const exam = await this.api.getExam(examCode).toPromise();
            const originalQuestions = exam?.questionDTOList || [];

            this.corrections = submittedQuestions.map(subQ => {
                const originalQ = originalQuestions.find(oq => oq.codeQuestion === subQ.codeQuestion);

                if (!originalQ) {
                    return null;
                }

                const originalAnswersMap = new Map<string, AnswerDTO>();
                originalQ.answers?.forEach(ans => {
                    originalAnswersMap.set(ans.codeAnswer!, ans);
                });

                const answers: AnswerCorrection[] = (subQ.answers || []).map(userAns => {
                    const originalAns = originalAnswersMap.get(userAns.codeAnswer!);
                    const actualStatus = originalAns?.answerStatus || 'WRONG';
                    return {
                        content: userAns.answerContent,
                        userStatus: userAns.answerStatus,
                        actualStatus: actualStatus as 'CORRECT' | 'WRONG',
                        isUserCorrect: userAns.answerStatus === 'CORRECT',
                        isActuallyCorrect: actualStatus === 'CORRECT'
                    };
                });

                const correctAnswerContent = originalQ.answers?.find(a => a.answerStatus === 'CORRECT')?.answerContent || '';

                const isFullyCorrect = answers.every(a =>
                    (a.isUserCorrect && a.isActuallyCorrect) || (!a.isUserCorrect && !a.isActuallyCorrect)
                );

                return {
                    content: subQ.questionContent,
                    answers: answers,
                    isFullyCorrect: isFullyCorrect,
                    correctAnswerContent: correctAnswerContent,
                    attachmentUrl: originalQ.attachmentUrl,
                    attachmentType: originalQ.attachmentType,
                    attachmentName: originalQ.attachmentName
                };
            }).filter(q => q !== null) as QuestionCorrection[];

            this.loading = false;
        } catch (err) {
            console.error(err);
            this.error = 'Erreur lors du chargement de la correction.';
            this.loading = false;
        }
    }

    backToDashboard() {
        this.testState.clear();
        this.router.navigate(['/dashboard']);
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