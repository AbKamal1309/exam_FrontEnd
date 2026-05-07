import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { LangService } from '../../services/lang.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { ExamDTO } from '../../models/models';

@Component({
  selector: 'app-exams',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NavbarComponent],
  templateUrl: './exams.component.html',
  styleUrls: ['./exams.component.css']
})
export class ExamsComponent implements OnInit {
  exams: ExamDTO[] = [];
  filtered: ExamDTO[] = [];
  search = '';
  filterStatus = '';
  loading = true;

  constructor(private api: ApiService, public lang: LangService) {}

  ngOnInit() {
    this.api.getExams().subscribe({
      next: exams => { this.exams = exams; this.filtered = exams; this.loading = false; },
      error: () => this.loading = false
    });
  }

  applyFilters() {
    this.filtered = this.exams.filter(e => {
      const matchSearch = !this.search ||
        e.codeExam?.toLowerCase().includes(this.search.toLowerCase()) ||
        e.description?.toLowerCase().includes(this.search.toLowerCase());
      const matchStatus = !this.filterStatus || e.status === this.filterStatus;
      return matchSearch && matchStatus;
    });
  }

  deleteExam(codeExam: string) {
    if (confirm(this.lang.t('exams.delete_confirm'))) {
      this.exams = this.exams.filter(e => e.codeExam !== codeExam);
      this.applyFilters();
    }
  }
}
