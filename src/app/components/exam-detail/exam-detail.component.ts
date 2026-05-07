import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { ExamDTO, TestResultDTO, BestScoreDTO } from '../../models/models';

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
    private api: ApiService,
    public auth: AuthService
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
    this.api.getAllTestForExam(this.codeExam).subscribe({
      next: res => this.allTests = res.testExamDTOList || []
    });
    this.api.getBestScore(this.codeExam).subscribe({
      next: score => this.bestScore = score
    });
  }

  startTest() {
    const userId = (this.auth.currentUser as any)?.id;
    this.router.navigate(['/test'], { queryParams: { userId, codeExam: this.codeExam } });
  }
}
