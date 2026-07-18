import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService, AdminStats } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { LangService } from '../../services/lang.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { UserDTO, ExamDTO, GroupResponseDTO } from '../../models/models';
import Swal from 'sweetalert2';

type AdminTab = 'stats' | 'users' | 'exams' | 'groups';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  activeTab: AdminTab = 'stats';

  stats: AdminStats | null = null;
  loadingStats = true;

  users: UserDTO[] = [];
  loadingUsers = true;
  userSearch = '';

  exams: ExamDTO[] = [];
  loadingExams = true;
  examSearch = '';

  groups: GroupResponseDTO[] = [];
  loadingGroups = true;
  groupSearch = '';

  constructor(
      private api: ApiService,
      public auth: AuthService,
      public lang: LangService
  ) {}

  ngOnInit() {
    this.loadStats();
    this.loadUsers();
    this.loadExams();
    this.loadGroups();
  }

  isUserAdmin(user: UserDTO): boolean {
    return !!user.roles?.includes('ADMIN');
  }

  setTab(tab: AdminTab) {
    this.activeTab = tab;
  }

  // ── STATS ──────────────────────────────────────────────

  loadStats() {
    this.loadingStats = true;
    this.api.getAdminStats().subscribe({
      next: stats => { this.stats = stats; this.loadingStats = false; },
      error: () => { this.loadingStats = false; }
    });
  }

  // ── UTILISATEURS ───────────────────────────────────────

  loadUsers() {
    this.loadingUsers = true;
    this.api.getUsers().subscribe({
      next: users => { this.users = users; this.loadingUsers = false; },
      error: () => { this.loadingUsers = false; }
    });
  }

  get filteredUsers(): UserDTO[] {
    const term = this.userSearch.trim().toLowerCase();
    if (!term) return this.users;
    return this.users.filter(u =>
        u.name?.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term)
    );
  }

  promoteUser(user: UserDTO) {
    Swal.fire({
      title: this.lang.t('admin.confirm_promote'),
      text: `${user.name} (${user.email})`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: this.lang.t('admin.confirm_yes'),
      cancelButtonText: this.lang.t('admin.confirm_no'),
      confirmButtonColor: '#2563eb'
    }).then(result => {
      if (!result.isConfirmed || !user.id) return;
      this.api.promoteToAdmin(user.id).subscribe({
        next: () => Swal.fire({
          toast: true, position: 'top-end', icon: 'success',
          title: this.lang.t('admin.promoted_success'),
          showConfirmButton: false, timer: 2500
        }),
        error: (err) => Swal.fire({
          icon: 'error', title: 'Erreur',
          text: err.error?.message || this.lang.t('admin.action_error')
        })
      });
    });
  }

  demoteUser(user: UserDTO) {
    Swal.fire({
      title: this.lang.t('admin.confirm_demote'),
      text: `${user.name} (${user.email})`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.lang.t('admin.confirm_yes'),
      cancelButtonText: this.lang.t('admin.confirm_no'),
      confirmButtonColor: '#dc2626'
    }).then(result => {
      if (!result.isConfirmed || !user.id) return;
      this.api.demoteFromAdmin(user.id).subscribe({
        next: () => Swal.fire({
          toast: true, position: 'top-end', icon: 'success',
          title: this.lang.t('admin.demoted_success'),
          showConfirmButton: false, timer: 2500
        }),
        error: (err) => Swal.fire({
          icon: 'error', title: 'Erreur',
          text: err.error?.message || this.lang.t('admin.action_error')
        })
      });
    });
  }

  deleteUser(user: UserDTO) {
    if (user.id === this.auth.getCurrentUserId()) {
      Swal.fire({ icon: 'warning', title: this.lang.t('admin.cannot_delete_self') });
      return;
    }
    Swal.fire({
      title: this.lang.t('admin.confirm_delete_user'),
      text: `${user.name} (${user.email})`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.lang.t('admin.confirm_yes'),
      cancelButtonText: this.lang.t('admin.confirm_no'),
      confirmButtonColor: '#dc2626'
    }).then(result => {
      if (!result.isConfirmed || !user.id) return;
      this.api.deleteUser(user.id).subscribe({
        next: () => {
          this.users = this.users.filter(u => u.id !== user.id);
          Swal.fire({
            toast: true, position: 'top-end', icon: 'success',
            title: this.lang.t('admin.deleted_user_success'),
            showConfirmButton: false, timer: 2500
          });
        },
        error: (err) => Swal.fire({
          icon: 'error', title: 'Erreur',
          text: err.error?.message || this.lang.t('admin.action_error')
        })
      });
    });
  }

  // ── EXAMENS (modération) ────────────────────────────────

  loadExams() {
    this.loadingExams = true;
    this.api.getExams().subscribe({
      next: exams => { this.exams = exams; this.loadingExams = false; },
      error: () => { this.loadingExams = false; }
    });
  }

  get filteredExams(): ExamDTO[] {
    const term = this.examSearch.trim().toLowerCase();
    if (!term) return this.exams;
    return this.exams.filter(e =>
        e.codeExam?.toLowerCase().includes(term) || e.description?.toLowerCase().includes(term)
    );
  }

  deleteExamAsAdmin(exam: ExamDTO) {
    Swal.fire({
      title: this.lang.t('admin.confirm_delete_exam'),
      text: exam.description || exam.codeExam,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.lang.t('admin.confirm_yes'),
      cancelButtonText: this.lang.t('admin.confirm_no'),
      confirmButtonColor: '#dc2626'
    }).then(result => {
      if (!result.isConfirmed || !exam.codeExam) return;
      this.api.adminDeleteExam(exam.codeExam).subscribe({
        next: () => {
          this.exams = this.exams.filter(e => e.codeExam !== exam.codeExam);
          Swal.fire({
            toast: true, position: 'top-end', icon: 'success',
            title: this.lang.t('admin.deleted_exam_success'),
            showConfirmButton: false, timer: 2500
          });
        },
        error: (err) => Swal.fire({
          icon: 'error', title: 'Erreur',
          text: err.error?.message || this.lang.t('admin.action_error')
        })
      });
    });
  }

  // ── GROUPES (modération) ────────────────────────────────

  loadGroups() {
    this.loadingGroups = true;
    this.api.getAllGroups().subscribe({
      next: groups => { this.groups = groups; this.loadingGroups = false; },
      error: () => { this.loadingGroups = false; }
    });
  }

  get filteredGroups(): GroupResponseDTO[] {
    const term = this.groupSearch.trim().toLowerCase();
    if (!term) return this.groups;
    return this.groups.filter(g =>
        g.name?.toLowerCase().includes(term) || g.creatorName?.toLowerCase().includes(term)
    );
  }

  deleteGroupAsAdmin(group: GroupResponseDTO) {
    Swal.fire({
      title: this.lang.t('admin.confirm_delete_group'),
      text: group.name,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.lang.t('admin.confirm_yes'),
      cancelButtonText: this.lang.t('admin.confirm_no'),
      confirmButtonColor: '#dc2626'
    }).then(result => {
      if (!result.isConfirmed) return;
      this.api.adminDeleteGroup(group.id).subscribe({
        next: () => {
          this.groups = this.groups.filter(g => g.id !== group.id);
          Swal.fire({
            toast: true, position: 'top-end', icon: 'success',
            title: this.lang.t('admin.deleted_group_success'),
            showConfirmButton: false, timer: 2500
          });
        },
        error: (err) => Swal.fire({
          icon: 'error', title: 'Erreur',
          text: err.error?.message || this.lang.t('admin.action_error')
        })
      });
    });
  }
}
