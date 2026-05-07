import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { ApiService } from '../../services/api.service';
import { ResponseTestScoreDTO } from '../../models/models';

@Component({
  selector: 'app-test-result',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  templateUrl: './test-result.component.html',
  styleUrls: ['./test-result.component.css']
})
export class TestResultComponent implements OnInit {
  result: ResponseTestScoreDTO | null = null;
  loading = true;
  error = '';

  constructor(private route: ActivatedRoute, private router: Router, private api: ApiService) {}

  ngOnInit() {
    const testId = this.route.snapshot.queryParamMap.get('testId') || '';
    this.api.getScore(testId).subscribe({
      next: res => { this.result = res; this.loading = false; },
      error: () => { this.error = 'Résultat introuvable.'; this.loading = false; }
    });
  }

  get scorePercent(): number {
    if (!this.result?.numberOfQuestions) return 0;
    return Math.round(((this.result.score || 0) / this.result.numberOfQuestions) * 100);
  }

  get scoreClass(): string {
    if (this.scorePercent >= 80) return 'excellent';
    if (this.scorePercent >= 60) return 'good';
    if (this.scorePercent >= 40) return 'average';
    return 'poor';
  }
}
