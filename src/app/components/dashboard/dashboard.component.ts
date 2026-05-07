import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { LangService } from '../../services/lang.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { ExamDTO } from '../../models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  myExams: ExamDTO[] = [];
  popularExams: string[] = [];
  loading = true;

  constructor(public auth: AuthService, public lang: LangService, private api: ApiService) {}

  ngOnInit() {
    const userId = (this.auth.currentUser as any)?.id;
    if (userId) {
      this.api.getExamsForUser(userId).subscribe({
        next: exams => { this.myExams = exams; this.loading = false; },
        error: () => { this.loading = false; }
      });
    } else { this.loading = false; }
    this.api.getPopularExams().subscribe({ next: e => this.popularExams = e });
  }

  get activatedCount() { return this.myExams.filter(e => e.status === 'ACTIVATED').length; }
  get createdCount()   { return this.myExams.filter(e => e.status === 'CREATED').length; }
  get suspendedCount() { return this.myExams.filter(e => e.status === 'SUSPENDED').length; }
}
