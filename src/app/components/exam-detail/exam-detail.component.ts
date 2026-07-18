import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { ExamDTO, TestResultDTO, BestScoreDTO } from '../../models/models';
import { LangService } from "../../services/lang.service";
import { MathJaxService } from '../../services/mathjax.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-exam-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NavbarComponent],
  templateUrl: './exam-detail.component.html',
  styleUrls: ['./exam-detail.component.css']
})
export class ExamDetailComponent implements OnInit {
  exam: ExamDTO | null = null;
  allTests: TestResultDTO[] = [];
  bestScore: BestScoreDTO | null = null;
  loading = true;
  error = '';
  codeExam = '';

  constructor(
      private route: ActivatedRoute,
      private router: Router,
      public api: ApiService,
      public auth: AuthService,
      public lang: LangService,
      private mathJax: MathJaxService,
      private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.codeExam = this.route.snapshot.paramMap.get('codeExam') || '';
    this.api.getExam(this.codeExam).subscribe({
      next: exam => {
        this.exam = exam;
        this.loading = false;
        this.loadStats();
      },
      error: () => { this.error = 'Examen introuvable'; this.loading = false; }
    });
  }

  loadStats() {
    this.api.getAllTestsForExam(this.codeExam).subscribe({
      next: res => this.allTests = res.testExamDTOList || []
    });
    this.api.getBestScore(this.codeExam).subscribe({
      next: score => this.bestScore = score
    });
  }

  confirmTakeExam(exam: ExamDTO) {
    Swal.fire({
      title: this.lang.t('test.confirm_title'),
      html: `${this.lang.t('test.confirm_text')} <strong>"${exam.codeExam}"</strong> ?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: this.lang.t('test.confirm_confirm'),
      cancelButtonText: this.lang.t('test.confirm_cancel'),
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#64748b'
    }).then((result) => {
      if (result.isConfirmed) {
        this.startTest();
      }
    });
  }

  startTest() {
    const userId = (this.auth.currentUser as any)?.id;
    this.router.navigate(['/test'], { queryParams: { userId, codeExam: this.codeExam } });
  }

  canEdit(): boolean {
    return this.exam?.userId === this.auth.getCurrentUserId();
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
