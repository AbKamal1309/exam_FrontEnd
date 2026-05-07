import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../navbar/navbar.component';
import { ApiService } from '../../services/api.service';
import { TestExamDTO, QuestionDTO, TestResultDTO } from '../../models/models';

@Component({
  selector: 'app-test',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.css']
})
export class TestComponent implements OnInit {
  testExam: TestExamDTO | null = null;
  questions: QuestionDTO[] = [];
  selectedAnswers: { [questionIndex: number]: number } = {};
  objectKeys = Object.keys;
  loading = true;
  submitting = false;
  error = '';
  result: TestResultDTO | null = null;
  userId = 0;
  codeExam = '';

  constructor(private route: ActivatedRoute, private router: Router, private api: ApiService) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.userId = +params['userId'];
      this.codeExam = params['codeExam'];
      this.api.getTestExam({ userId: this.userId, codeExam: this.codeExam }).subscribe({
        next: testExam => {
          this.testExam = testExam;
          this.questions = testExam.examDTO?.questionDTOList || [];
          this.loading = false;
        },
        error: () => { this.error = 'Impossible de charger le test.'; this.loading = false; }
      });
    });
  }

  selectAnswer(qIndex: number, aIndex: number) {
    this.selectedAnswers[qIndex] = aIndex;
  }

  get progress(): number {
    return Math.round((Object.keys(this.selectedAnswers).length / this.questions.length) * 100);
  }

  get allAnswered(): boolean {
    return Object.keys(this.selectedAnswers).length === this.questions.length;
  }

  submitTest() {
    this.submitting = true;
    // Build the questions with selected answers
    const answeredQuestions = this.questions.map((q, qi) => ({
      ...q,
      answers: q.answers?.map((a, ai) => ({
        ...a,
        answerStatus: ai === this.selectedAnswers[qi] ? 'CORRECT' : 'WRONG'
      })) as any
    }));

    this.api.sendTest({ userId: this.userId, codeExam: this.codeExam, questionDTOS: answeredQuestions }).subscribe({
      next: result => {
        this.result = result;
        this.submitting = false;
        this.router.navigate(['/test-result'], { queryParams: { testId: result.testId } });
      },
      error: () => { this.error = 'Erreur lors de la soumission.'; this.submitting = false; }
    });
  }
}
