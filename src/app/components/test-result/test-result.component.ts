import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { TestStateService } from '../../services/test-state.service';
import { ApiService } from '../../services/api.service';
import { TestResultDTO } from '../../models/models';
import { LangService } from '../../services/lang.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-test-result',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  templateUrl: './test-result.component.html',
  styleUrls: ['./test-result.component.css']
})
export class TestResultComponent implements OnInit {
  result: TestResultDTO | null = null;
  loading = true;
  error = '';
  testId = '';
  examCode: string = ''; // ← AJOUTER CETTE PROPRIÉTÉ

  constructor(
      private router: Router,
      private route: ActivatedRoute,
      private testState: TestStateService,
      private api: ApiService,
      public lang: LangService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.testId = params['testId'];
      if (this.testId) {
        this.loadResult();
      } else {
        this.loadResultFromState();
      }
    });
  }

  loadResult() {
    this.api.getScore(this.testId).subscribe({
      next: (res: TestResultDTO) => {
        this.result = res;
        this.examCode = res.examId || '';
        this.loading = false;
      },
      error: () => {
        this.loadResultFromState();
      }
    });
  }

  loadResultFromState() {
    const stateResult = this.testState.getTestResult();
    if (stateResult) {
      this.result = stateResult;
      this.examCode = stateResult.examId || '';
      this.loading = false;
    } else {
      this.error = 'Aucun résultat trouvé.';
      this.loading = false;
    }
  }

  getScorePercent(): number {
    if (!this.result?.totalQuestions) return 0;
    return Math.round((this.result.score || 0) / this.result.totalQuestions * 100);
  }

  getScoreClass(): string {
    const percent = this.getScorePercent();
    if (percent >= 80) return 'excellent';
    if (percent >= 60) return 'good';
    if (percent >= 40) return 'average';
    return 'poor';
  }

  // Nouvelle méthode pour refaire le test
  retakeTest() {
    if (!this.examCode) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de retrouver l\'examen.',
        confirmButtonText: 'OK'
      });
      return;
    }

    Swal.fire({
      title: this.lang.t('test_result.retake_confirm_title'),
      html: `${this.lang.t('test_result.retake_confirm_text')}<br><strong>"${this.result?.userNameTest || ''}"</strong>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: this.lang.t('test_result.retake_confirm_yes'),
      cancelButtonText: this.lang.t('test_result.retake_confirm_no'),
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#64748b'
    }).then((result) => {
      if (result.isConfirmed) {
        const userId = this.getUserIdFromStorage();
        this.router.navigate(['/test'], {
          queryParams: { userId, codeExam: this.examCode }
        });
      }
    });
  }

  getUserIdFromStorage(): number {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      const user = JSON.parse(currentUser);
      return user.id || 0;
    }
    return 0;
  }

  goToCorrection() {
    this.router.navigate(['/test-correction'], { queryParams: { testId: this.testId } });
  }

  backToDashboard() {
    this.testState.clear();
    this.router.navigate(['/dashboard']);
  }
}