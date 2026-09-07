import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router ,NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { LangService } from '../../services/lang.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { ExamDTO, GroupResponseDTO, JoinRequestDTO ,TestResultDTO, ResponseAllTestExam} from '../../models/models';
import Swal from "sweetalert2";
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NavbarComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  myExams: ExamDTO[] = [];
  publicExams: ExamDTO[] = [];
  sharedExams: ExamDTO[] = [];
  popularExams: string[] = [];
  myGroups: GroupResponseDTO[] = [];
  loading = true;
  showShareModal = false;
  showJoinGroupModal = false;
  selectedExam: ExamDTO | null = null;
  selectedGroupId = 0;

  // Propriétés pour la recherche de groupes
  allGroups: GroupResponseDTO[] = [];
  filteredGroups: GroupResponseDTO[] = [];
  groupSearchQuery = '';
  isSearching = false;
  joinRequestPending: { [groupId: number]: boolean } = {};

  // Pour stocker les tests par examen
  testsMap: { [examCode: string]: TestResultDTO[] } = {};
  testsCountMap: { [examCode: string]: number } = {};

  // Pour les droits d'accès aux tests
  adminGroups: GroupResponseDTO[] = [];
  sharedExamsByAdminGroup: { [groupId: number]: ExamDTO[] } = {};

  // Modal
  showTestsModal = false;
  selectedExamTests: TestResultDTO[] = [];
  selectedExamTitle = '';

  selectedTest: TestResultDTO | null = null;
  showTestDetailsModal = false;


  constructor(
      public auth: AuthService,
      public lang: LangService,
      private api: ApiService,
      private router: Router,
  ) {
    this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe((event) => {
          if ((event as NavigationEnd).urlAfterRedirects === '/dashboard' && this.myExams.length > 0) {
            this.refreshTestsCounts();
          }
        });
  }

  ngOnInit() {
    const userId = this.auth.getCurrentUserId();
    if (userId) {
      this.loadExams(userId);
      this.loadGroups(userId);
      this.loadSharedExams(userId);
      this.loadUserPendingRequests(userId);
      this.loadAdminGroups(userId);
    }
    this.api.getPublicExams().subscribe({
      next: (exams: ExamDTO[]) => {
        this.publicExams = exams.filter(e => e.userId !== userId);
      },
      error: (err) => console.error('Erreur chargement examens publics', err)
    });
    this.api.getPopularExams().subscribe({
      next: (e: string[]) => this.popularExams = e,
      error: (err) => console.error('Erreur chargement examens populaires', err)
    });

    // Charger tous les groupes disponibles
    this.loadAllGroups();
  }


  // ==================== CHARGEMENT DES DONNÉES ====================

  loadExams(userId: number) {
    this.api.getExamsForUser(userId).subscribe({
      next: (exams: ExamDTO[]) => {
        this.myExams = exams;
        this.loading = false;
        this.refreshTestsCounts();
      },
      error: () => { this.loading = false; }
    });
  }

  loadGroups(userId: number) {
    this.api.getGroupsByMember(userId).subscribe({
      next: (groups: GroupResponseDTO[]) => {
        this.myGroups = groups;
      },
      error: (err) => console.error('Erreur chargement groupes', err)
    });
  }

  loadSharedExams(userId: number) {
    if (this.myGroups.length === 0) return;
    const examPromises = this.myGroups.map(group =>
        this.api.getGroupSharedExams(group.id, userId).toPromise()
    );
    Promise.all(examPromises).then(results => {
      this.sharedExams = results.flat().filter(e => e) as ExamDTO[];
    });
  }

  loadUserPendingRequests(userId: number) {
    this.api.getUserPendingRequests(userId).subscribe({
      next: (requests: JoinRequestDTO[]) => {
        requests.forEach(req => {
          this.joinRequestPending[req.groupId] = true;
        });
      },
      error: (err) => console.error('Erreur chargement demandes', err)
    });
  }

  loadAllGroups() {
    this.api.getAllGroups().subscribe({
      next: (groups: GroupResponseDTO[]) => {
        this.allGroups = groups;
        this.filterGroups();
      },
      error: (err) => console.error('Erreur chargement tous les groupes', err)
    });
  }

  // ==================== RECHERCHE EN TEMPS RÉEL ====================

  filterGroups() {
    const userId = this.auth.getCurrentUserId();
    const query = this.groupSearchQuery.toLowerCase().trim();

    // Si pas de recherche, ne rien afficher
    if (!query) {
      this.filteredGroups = [];
      this.isSearching = false;
      return;
    }

    this.filteredGroups = this.allGroups.filter(group => {
      // Exclure les groupes dont l'utilisateur est déjà membre
      const isMember = this.myGroups.some(myGroup => myGroup.id === group.id);
      if (isMember) return false;

      // Exclure ses propres groupes
      if (group.creatorId === userId) return false;

      // Filtre par recherche textuelle
      return group.name.toLowerCase().includes(query) ||
          (group.description && group.description.toLowerCase().includes(query));
    });
    this.isSearching = true;
  }
  openJoinGroupModal() {
    this.showJoinGroupModal = true;
    this.groupSearchQuery = '';
    this.filteredGroups = [];  // ← Vider les résultats au départ
    this.isSearching = false;  // ← Désactiver l'affichage des résultats
  }

  closeJoinGroupModal() {
    this.showJoinGroupModal = false;
  }

  // ==================== GESTION DES DEMANDES ====================

  isJoinRequestPending(group: GroupResponseDTO): boolean {
    return this.joinRequestPending[group.id] === true;
  }

  getJoinButtonText(group: GroupResponseDTO): string {
    if (this.isJoinRequestPending(group)) {
      return this.lang.t('dashboard.request_pending');
    }
    if (group.visibility === 'PUBLIC') {
      return this.lang.t('dashboard.join');
    }
    return this.lang.t('dashboard.request_to_join');
  }

  joinGroup(group: GroupResponseDTO) {
    const userId = this.auth.getCurrentUserId();

    // Vérifier si déjà membre
    const isAlreadyMember = this.myGroups.some(g => g.id === group.id);
    if (isAlreadyMember) {
      Swal.fire({
        icon: 'warning',
        title: this.lang.t('groups.already_member'),
        text: `"${group.name}"`,
        confirmButtonText: this.lang.t('groups.cancel'),
        confirmButtonColor: '#64748b'
      });
      return;
    }

    // Vérifier si une demande est déjà en attente
    if (this.isJoinRequestPending(group)) {
      Swal.fire({
        icon: 'info',
        title: this.lang.t('groups.join_request_pending'),
        text: `"${group.name}"`,
        confirmButtonText: this.lang.t('groups.cancel'),
        confirmButtonColor: '#64748b'
      });
      return;
    }

    // Fermer le modal avant la confirmation
    this.closeJoinGroupModal();

    if (group.visibility === 'PUBLIC') {
      // Confirmation pour rejoindre un groupe public
      Swal.fire({
        title: this.lang.t('groups.confirm_join_request_title'),
        html: `${this.lang.t('groups.confirm_join_request_text')}<br><strong>"${group.name}"</strong>`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: this.lang.t('groups.confirm_join_request_confirm'),
        cancelButtonText: this.lang.t('groups.confirm_join_request_cancel'),
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#64748b'
      }).then((result) => {
        if (result.isConfirmed) {
          this.api.addMember(group.id,userId).subscribe({
            next: () => {
              Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: this.lang.t('groups.joined_success'),
                text: `"${group.name}"`,
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
              });
              this.closeJoinGroupModal();
              this.loadGroups(userId);
              this.loadAllGroups();
              this.filterGroups();
            },
            error: (err) => {
              console.error('Erreur:', err);
              Swal.fire({
                icon: 'error',
                title: this.lang.t('groups.join_request_error'),
                text: err.error?.message || this.lang.t('dashboard.join_error'),
                confirmButtonText: this.lang.t('groups.cancel'),
                confirmButtonColor: '#dc2626'
              });
            }
          });
        }
      });
    } else {
      // Confirmation pour demander à rejoindre un groupe privé
      Swal.fire({
        title: this.lang.t('groups.confirm_join_request_title'),
        html: `${this.lang.t('groups.confirm_join_request_text')}<br><strong>"${group.name}"</strong>`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: this.lang.t('groups.confirm_join_request_confirm'),
        cancelButtonText: this.lang.t('groups.confirm_join_request_cancel'),
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#64748b'
      }).then((result) => {
        if (result.isConfirmed) {
          this.api.sendJoinRequest(group.id).subscribe({
            next: () => {
              Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: this.lang.t('groups.join_request_sent'),
                text: `"${group.name}"`,
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
              });
              this.joinRequestPending[group.id] = true;
              this.filterGroups();
            },
            error: (err) => {
              console.error('Erreur:', err);
              Swal.fire({
                icon: 'error',
                title: this.lang.t('groups.join_request_error'),
                text: err.error?.message || this.lang.t('dashboard.request_error'),
                confirmButtonText: this.lang.t('groups.cancel'),
                confirmButtonColor: '#dc2626'
              });
            }
          });
        }
      });
    }
  }
  // ==================== GESTION DE LA VISIBILITÉ ====================

  toggleVisibility(exam: ExamDTO) {
    if (!exam.codeExam) {
      console.error('Code examen manquant');
      return;
    }

    const userId = this.auth.getCurrentUserId();
    const newVisibility = exam.visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC';

    this.api.updateVisibility(exam.codeExam, newVisibility, userId).subscribe({
      next: (updatedExam: ExamDTO) => {
        this.updateExamInLists(updatedExam);
      },
      error: (err) => {
        console.error('Erreur:', err);
        alert(this.lang.t('dashboard.visibility_error'));
      }
    });
  }

  private updateExamInLists(updatedExam: ExamDTO) {
    const myIndex = this.myExams.findIndex(e => e.codeExam === updatedExam.codeExam);
    if (myIndex !== -1) {
      this.myExams[myIndex] = updatedExam;
    }

    const publicIndex = this.publicExams.findIndex(e => e.codeExam === updatedExam.codeExam);
    if (publicIndex !== -1) {
      this.publicExams[publicIndex] = updatedExam;
    }

    const sharedIndex = this.sharedExams.findIndex(e => e.codeExam === updatedExam.codeExam);
    if (sharedIndex !== -1) {
      this.sharedExams[sharedIndex] = updatedExam;
    }
  }

  // ==================== PARTAGE D'EXAMEN ====================

  openShareModal(exam: ExamDTO) {
    if (this.getAdminGroups().length === 0) {
      alert(this.lang.t('dashboard.no_admin_groups'));
      return;
    }
    this.selectedExam = exam;
    this.selectedGroupId = 0;
    this.showShareModal = true;
  }

  shareExamWithGroup() {
    if (this.selectedExam && this.selectedGroupId) {
      this.api.shareExamWithGroup({
        examCode: this.selectedExam.codeExam!,
        groupId: this.selectedGroupId,
        adminId: this.auth.getCurrentUserId()
      }).subscribe({
        next: () => {
          this.showShareModal = false;
          Swal.fire({
            title: 'Succès !',
            text: 'Examen partagé avec succès !',
            icon: 'success',
            timer: 5000,
            showConfirmButton: false,
            position: 'top-end',
            toast: true
          });
          this.selectedGroupId = 0;
          this.selectedExam = null;
          //(this.lang.t('dashboard.exam_shared'));
        },
        error: () => alert(this.lang.t('dashboard.share_error'))
      });
    }
  }

  getAdminGroups(): GroupResponseDTO[] {
    const userId = this.auth.getCurrentUserId();
    return this.myGroups.filter(g => g.admins.some(a => a.id === userId));
  }

  // ==================== PASSER UN TEST ====================

  takeExam(exam: ExamDTO) {
    const userId = this.auth.getCurrentUserId();
    this.router.navigate(['/test'], { queryParams: { userId, codeExam: exam.codeExam } });
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
        this.takeExam(exam);
      }
    });
  }

  canTakeExam(exam: ExamDTO): boolean {
    const userId = this.auth.getCurrentUserId();
    if (exam.userId === userId) return false;
    if (exam.visibility === 'PUBLIC') return true;
    return this.sharedExams.some(shared => shared.codeExam === exam.codeExam);
  }

  ////////
  // Charge les groupes où l'utilisateur est admin et leurs examens partagés
  loadAdminGroups(userId: number) {
    this.api.getGroupsByMember(userId).subscribe({
      next: (groups) => {
        this.adminGroups = groups.filter(g => g.admins.some(a => a.id === userId));
        this.adminGroups.forEach(group => {
          this.api.getGroupSharedExams(group.id, userId).subscribe({
            next: (exams) => {
              this.sharedExamsByAdminGroup[group.id] = exams;
              // Recharger les compteurs de tests pour ces examens
              exams.forEach(exam => {
                if (exam.codeExam && !this.testsCountMap[exam.codeExam]) {
                  this.loadTestsCount(exam.codeExam);
                }
              });
            },
            error: (err) => console.error('Erreur chargement examens partagés', err)
          });
        });
      },
      error: (err) => console.error('Erreur chargement groupes', err)
    });
  }

  // Charge le nombre de tests pour un examen spécifique
  loadTestsCount(examCode: string) {
    this.api.getAllTestsForExam(examCode).subscribe({
      next: (response: ResponseAllTestExam) => {
        const tests = response.testExamDTOList || [];
        this.testsMap[examCode] = tests;
        this.testsCountMap[examCode] = tests.length;
      },
      error: (err) => {
        console.error(`Erreur chargement tests pour ${examCode}`, err);
        this.testsCountMap[examCode] = 0;
      }
    });
  }

  // Vérifie si l'utilisateur peut voir les tests d'un examen
  canViewTests(exam: ExamDTO): boolean {
    // 1. Créateur
    if (exam.userId === this.auth.getCurrentUserId()) return true;
    // 2. Examen public
    if (exam.visibility === 'PUBLIC') return true;
    // 3. Admin d'un groupe partageant cet examen
    for (const group of this.adminGroups) {
      const sharedExams = this.sharedExamsByAdminGroup[group.id] || [];
      if (sharedExams.some(e => e.codeExam === exam.codeExam)) {
        return true;
      }
    }
    return false;
  }

  // Ouvre le modal des tests
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

  getTestsCount(exam: ExamDTO): number {
    return this.testsCountMap[exam.codeExam!] || 0;
  }

  viewTestDetails(test: TestResultDTO) {
    this.selectedTest = test;
    this.showTestDetailsModal = true;
  }

  closeTestDetailsModal() {
    this.showTestDetailsModal = false;
    this.selectedTest = null;
  }

  refreshTestsCounts() {
    this.myExams.forEach(exam => {
      if (exam.codeExam) {
        this.loadTestsCount(exam.codeExam);
      }
    });
  }


  // ==================== STATISTIQUES ====================

  get activatedCount() {
    return this.myExams.filter(e => e.status === 'ACTIVATED').length;
  }
  get createdCount() {
    return this.myExams.filter(e => e.status === 'CREATED').length;
  }
  get suspendedCount() {
    return this.myExams.filter(e => e.status === 'SUSPENDED').length;
  }

  // ==================== CODE EXAMEN COPIABLE ====================
  // Même logique que la version mobile : au lieu d'afficher le code en pleine
  // largeur, on le rend compact et on permet de le copier au clic plutôt que de
  // le laisser prendre toute la place visuellement.
  copyExamCode(code: string | undefined) {
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: this.lang.t('dashboard.code_copied'),
        showConfirmButton: false,
        timer: 1500
      });
    });
  }
}