import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { LangService } from '../../services/lang.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { ExamDTO, ResponseAllTestExam, TestResultDTO, GroupResponseDTO } from '../../models/models';
import { AuthService } from "../../services/auth.service";
import Swal from 'sweetalert2';

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

  // Map pour stocker les tests par examen
  testsMap: { [examCode: string]: TestResultDTO[] } = {};
  testsCountMap: { [examCode: string]: number } = {};

  // Modal
  showTestsModal = false;
  selectedExamTests: TestResultDTO[] = [];
  selectedExamTitle = '';

  // Pour les droits d'accès aux tests
  adminGroups: GroupResponseDTO[] = [];
  sharedExamsByAdminGroup: { [groupId: number]: ExamDTO[] } = {};

  selectedTest: TestResultDTO | null = null;
  showTestDetailsModal = false;

  // Partage d'examen (point 5)
  showShareModal = false;
  selectedExam: ExamDTO | null = null;
  selectedGroupId = 0;

  constructor(
      private api: ApiService,
      public lang: LangService,
      public auth: AuthService
  ) {}

  ngOnInit() {
    this.loadExams();
    this.loadAdminGroups();
  }

  // Charge les groupes où l'utilisateur est admin et leurs examens partagés
  loadAdminGroups() {
    const userId = this.auth.getCurrentUserId();
    this.api.getGroupsByMember(userId).subscribe({
      next: (groups: GroupResponseDTO[]) => {
        // Filtrer les groupes où l'utilisateur est admin
        this.adminGroups = groups.filter(g => g.admins.some(a => a.id === userId));

        // Pour chaque groupe admin, charger ses examens partagés
        this.adminGroups.forEach(group => {
          this.api.getGroupSharedExams(group.id, userId).subscribe({
            next: (exams: ExamDTO[]) => {
              this.sharedExamsByAdminGroup[group.id] = exams;
            },
            error: (err) => console.error('Erreur chargement examens partagés', err)
          });
        });
      },
      error: (err) => console.error('Erreur chargement groupes', err)
    });
  }

  loadExams() {
    this.loading = true;
    const userId = this.auth.getCurrentUserId();

    // 1. Récupérer les examens personnels de l'utilisateur
    this.api.getExamsForUser(userId).subscribe({
      next: (myExams: ExamDTO[]) => {
        // 2. Récupérer les examens publics (exclure les siens)
        this.api.getPublicExams().subscribe({
          next: (publicExams: ExamDTO[]) => {
            const filteredPublic = publicExams.filter(e => e.userId !== userId);

            // 3. Récupérer les groupes de l'utilisateur pour les examens partagés
            this.api.getGroupsByMember(userId).subscribe({
              next: (groups) => {
                if (groups.length === 0) {
                  this.exams = [...myExams, ...filteredPublic];
                  this.loadTestsCounts();
                  this.applyFilters();
                  this.loading = false;
                  return;
                }

                // Récupérer les examens partagés dans chaque groupe
                const sharedExamsPromises = groups.map(group =>
                    this.api.getGroupSharedExams(group.id, userId).toPromise()
                );

                Promise.all(sharedExamsPromises).then(results => {
                  let sharedExams: ExamDTO[] = [];
                  results.forEach(res => {
                    if (res) sharedExams = [...sharedExams, ...res];
                  });

                  // Supprimer les doublons
                  const uniqueShared = sharedExams.filter((exam, index, self) =>
                      index === self.findIndex(e => e.codeExam === exam.codeExam)
                  );

                  // Fusionner les trois sources
                  this.exams = [...myExams, ...filteredPublic, ...uniqueShared];
                  this.loadTestsCounts();
                  this.applyFilters();
                  this.loading = false;
                }).catch(() => {
                  this.exams = [...myExams, ...filteredPublic];
                  this.loadTestsCounts();
                  this.applyFilters();
                  this.loading = false;
                });
              },
              error: () => {
                this.exams = [...myExams, ...filteredPublic];
                this.loadTestsCounts();
                this.applyFilters();
                this.loading = false;
              }
            });
          },
          error: () => {
            this.exams = [...myExams];
            this.loadTestsCounts();
            this.applyFilters();
            this.loading = false;
          }
        });
      },
      error: (err) => {
        console.error('Erreur chargement examens', err);
        this.loading = false;
      }
    });
  }

  // Charger le nombre de tests pour chaque examen
  loadTestsCounts() {
    this.exams.forEach(exam => {
      if (exam.codeExam) {
        this.api.getAllTestsForExam(exam.codeExam).subscribe({
          next: (response: ResponseAllTestExam) => {
            const tests = response.testExamDTOList || [];
            this.testsMap[exam.codeExam!] = tests;
            this.testsCountMap[exam.codeExam!] = tests.length;
          },
          error: (err) => {
            console.error(`Erreur chargement tests pour ${exam.codeExam}`, err);
            this.testsCountMap[exam.codeExam!] = 0;
          }
        });
      }
    });
  }

  getTestsCount(exam: ExamDTO): number {
    return this.testsCountMap[exam.codeExam!] || 0;
  }

  // Vérifie si l'utilisateur a le droit de voir les tests d'un examen
  canViewTests(exam: ExamDTO): boolean {
    const userId = this.auth.getCurrentUserId();

    // 1. L'utilisateur est le créateur
    if (exam.userId === userId) return true;

    // 2. L'examen est public
    if (exam.visibility === 'PUBLIC') return true;

    // 3. L'utilisateur est admin d'un groupe qui partage cet examen
    for (const group of this.adminGroups) {
      const sharedExams = this.sharedExamsByAdminGroup[group.id] || [];
      if (sharedExams.some(e => e.codeExam === exam.codeExam)) {
        return true;
      }
    }

    return false;
  }

  openTestsModal(exam: ExamDTO) {
    // Vérifier les droits avant d'ouvrir
    if (!this.canViewTests(exam)) {
      Swal.fire({
        icon: 'warning',
        title: this.lang.t('exams.access_denied'),
        text: this.lang.t('exams.no_rights'),
        confirmButtonText: 'OK',
        confirmButtonColor: '#64748b'
      });
      return;
    }

    const tests = this.testsMap[exam.codeExam!] || [];

    if (tests.length === 0) {
      // Recharger les tests au moment du clic
      this.api.getAllTestsForExam(exam.codeExam!).subscribe({
        next: (response: ResponseAllTestExam) => {
          const loadedTests = response.testExamDTOList || [];
          this.testsMap[exam.codeExam!] = loadedTests;
          this.testsCountMap[exam.codeExam!] = loadedTests.length;

          if (loadedTests.length === 0) {
            Swal.fire({
              icon: 'info',
              title: this.lang.t('exams.no_tests'),
              text: this.lang.t('exams.no_tests_text'),
              confirmButtonText: 'OK'
            });
          } else {
            this.selectedExamTitle = exam.description || exam.codeExam!;
            this.selectedExamTests = loadedTests;
            this.showTestsModal = true;
          }
        },
        error: (err) => {
          console.error('Erreur chargement tests', err);
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: 'Impossible de charger les tests pour cet examen'
          });
        }
      });
      return;
    }

    this.selectedExamTitle = exam.description || exam.codeExam!;
    this.selectedExamTests = tests;
    this.showTestsModal = true;
  }

  closeTestsModal() {
    this.showTestsModal = false;
    this.selectedExamTests = [];
  }

  viewTestDetails(test: TestResultDTO) {
    this.selectedTest = test;
    this.showTestDetailsModal = true;
  }

  closeTestDetailsModal() {
    this.showTestDetailsModal = false;
    this.selectedTest = null;
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

  canEdit(exam: ExamDTO): boolean {
    return exam.userId === this.auth.getCurrentUserId();
  }

  canDelete(exam: ExamDTO): boolean {
    return exam.userId === this.auth.getCurrentUserId();
  }

  getVisibilityLabel(exam: ExamDTO): string {
    const userId = this.auth.getCurrentUserId();
    if (exam.visibility === 'PUBLIC') {
      return '🌍 Public';
    }
    if (exam.userId === userId) {
      return '🔒 Privé (vous)';
    }
    return '🔒 Privé (partagé)';
  }

  deleteExam(codeExam: string, examName?: string) {
    const name = examName || codeExam;
    const userId = this.auth.getCurrentUserId();

    Swal.fire({
      title: this.lang.t('exams.delete_confirm'),
      html: `${this.lang.t('exams.delete_confirm_text')}<br><strong>"${name}"</strong>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.lang.t('exams.delete_confirm_yes'),
      cancelButtonText: this.lang.t('exams.delete_confirm_no'),
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b'
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.deleteExam(codeExam, userId).subscribe({
          next: () => {
            this.exams = this.exams.filter(e => e.codeExam !== codeExam);
            this.applyFilters();

            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'success',
              title: this.lang.t('exams.deleted_success'),
              text: `"${name}" ${this.lang.t('exams.deleted_success')}`,
              showConfirmButton: false,
              timer: 3000
            });
          },
          error: (err) => {
            console.error('Erreur suppression examen', err);
            Swal.fire({
              icon: 'error',
              title: this.lang.t('exams.delete_error'),
              text: err.error?.message || this.lang.t('exams.delete_error_text'),
              confirmButtonText: this.lang.t('exams.cancel')
            });
          }
        });
      }
    });
  }

  // ==================== PARTAGE D'EXAMEN (point 5) ====================

  openShareModal(exam: ExamDTO) {
    if (this.adminGroups.length === 0) {
      Swal.fire({
        icon: 'info',
        title: this.lang.t('dashboard.no_admin_groups'),
        confirmButtonText: 'OK'
      });
      return;
    }
    this.selectedExam = exam;
    this.selectedGroupId = 0;
    this.showShareModal = true;
  }

  closeShareModal() {
    this.showShareModal = false;
    this.selectedExam = null;
    this.selectedGroupId = 0;
  }

  shareExamWithGroup() {
    if (!this.selectedExam || !this.selectedGroupId) return;

    const examName = this.selectedExam.description || this.selectedExam.codeExam;

    this.api.shareExamWithGroup({
      examCode: this.selectedExam.codeExam!,
      groupId: this.selectedGroupId,
      adminId: this.auth.getCurrentUserId() // ignoré côté backend, dérivé du JWT
    }).subscribe({
      next: () => {
        this.showShareModal = false;
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: this.lang.t('groups.exam_shared_toast'),
          text: `"${examName}" ${this.lang.t('groups.exam_shared_success')}`,
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });
        this.selectedExam = null;
        this.selectedGroupId = 0;
      },
      error: (err) => {
        console.error('Erreur partage examen', err);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: err.error?.message || this.lang.t('dashboard.share_error'),
          confirmButtonText: 'OK',
          confirmButtonColor: '#dc2626'
        });
      }
    });
  }

}