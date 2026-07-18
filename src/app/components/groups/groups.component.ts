import { Component, OnDestroy, OnInit } from '@angular/core';
import { ChangeDetectorRef } from "@angular/core";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin, of, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { LangService } from '../../services/lang.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { GroupResponseDTO, GroupRequestDTO, UserDTO, ExamDTO, JoinRequestDTO } from '../../models/models';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-groups',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
    templateUrl: './groups.component.html',
    styleUrls: ['./groups.component.css']
})
export class GroupsComponent implements OnInit, OnDestroy {
    myGroups: GroupResponseDTO[] = [];
    allUsers: UserDTO[] = [];
    allGroups: GroupResponseDTO[] = [];
    loading = true;
    showCreateModal = false;
    showAddMemberModal = false;
    showAddExamModal = false;
    showRequestsModal = false;
    selectedGroup: GroupResponseDTO | null = null;
    groupSharedExams: { [groupId: number]: ExamDTO[] } = {};

    newGroup: GroupRequestDTO = { name: '', description: '', creatorId: 0 };
    isPublicGroup = false;

    memberSearch = '';
    selectedUserId = 0;
    availableExams: ExamDTO[] = [];
    selectedExamCode = '';
    pendingRequests: { [groupId: number]: JoinRequestDTO[] } = {};

    private userCache: { [id: number]: string } = {};
    private pollingInterval: any; // Pour le polling
    private lastRequestCounts: { [groupId: number]: number } = {}; // Pour suivre les changements

    constructor(
        private api: ApiService,
        public auth: AuthService,
        public lang: LangService,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit() {
        this.loadGroups();
        this.loadUsers();
        this.startPolling(); // Démarrer le polling
    }

    ngOnDestroy() {
        // Arrêter le polling à la destruction
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
    }

    // ==================== POLLING ====================

    startPolling() {
        // Vérifier les nouvelles demandes toutes les 3 secondes
        this.pollingInterval = setInterval(() => {
            this.checkForNewRequests();
        }, 3000);
    }

    checkForNewRequests() {
        const userId = this.auth.getCurrentUserId();

        this.myGroups.forEach(group => {
            if (this.isAdminOfGroup(group, userId)) {
                this.api.getPendingJoinRequests(group.id).subscribe({
                    next: (requests: JoinRequestDTO[]) => {
                        const oldCount = this.lastRequestCounts[group.id] || 0;
                        const newCount = requests.length;

                        // Mettre à jour les demandes
                        this.pendingRequests = {
                            ...this.pendingRequests,
                            [group.id]: requests
                        };

                        // Sauvegarder le nouveau compteur
                        this.lastRequestCounts[group.id] = newCount;

                        // Si nouvelle demande détectée
                        if (newCount > oldCount) {
                            this.showNewRequestNotification(group.name, newCount - oldCount);
                            this.cdr.detectChanges(); // Forcer la mise à jour du badge
                        }
                    },
                    error: (err) => console.error('Erreur refresh demandes', err)
                });
            }
        });
    }

    showNewRequestNotification(groupName: string, count: number) {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'info',
            title: '📬 Nouvelle demande',
            text: `${count} nouvelle(s) demande(s) pour "${groupName}"`,
            showConfirmButton: false,
            timer: 4000,
            timerProgressBar: true,
            background: '#fff',
            iconColor: '#2563eb'
        });

        // Optionnel : jouer un son
        // const audio = new Audio('/assets/notification.mp3');
        // audio.play();
    }

    // ==================== CHARGEMENT DES DONNÉES ====================

    loadGroups() {
        this.loading = true;
        const userId = this.auth.getCurrentUserId();
        this.api.getGroupsByMember(userId).subscribe({
            next: (groups: GroupResponseDTO[]) => {
                this.myGroups = groups;
                // Charger les examens partagés et les demandes pour chaque groupe
                groups.forEach(group => {
                    this.loadGroupSharedExams(group.id);
                    if (this.isAdminOfGroup(group, userId)) {
                        this.loadPendingRequests(group.id);
                        // Initialiser le compteur
                        this.lastRequestCounts[group.id] = 0;
                    }
                });
                this.loading = false;
            },
            error: () => {
                this.loading = false;
            }
        });
    }

    loadGroupSharedExams(groupId: number) {
        const userId = this.auth.getCurrentUserId();
        this.api.getGroupSharedExams(groupId, userId).subscribe({
            next: (exams: ExamDTO[]) => {
                const enrichment$ = exams.map(exam =>
                    exam.userId ? this.getUserName(exam.userId).pipe(
                        map(userName => ({ ...exam, creatorName: userName }))
                    ) : of(exam)
                );
                forkJoin(enrichment$).subscribe(enrichedExams => {
                    this.groupSharedExams = {
                        ...this.groupSharedExams,
                        [groupId]: enrichedExams as ExamDTO[]
                    };
                });
            },
            error: (err) => console.error('Erreur chargement examens partagés', err)
        });
    }

    loadUsers() {
        this.api.getUsers().subscribe({
            next: (users: UserDTO[]) => {
                this.allUsers = users;
            },
            error: (err) => console.error('Erreur chargement utilisateurs', err)
        });
    }

    loadAvailableExams() {
        const userId = this.auth.getCurrentUserId();
        this.api.getExamsForUser(userId).subscribe({
            next: (exams: ExamDTO[]) => {
                this.availableExams = exams;
            },
            error: (err) => console.error('Erreur chargement examens', err)
        });
    }

    loadPendingRequests(groupId: number) {
        this.api.getPendingJoinRequests(groupId).subscribe({
            next: (requests: JoinRequestDTO[]) => {
                this.pendingRequests = {
                    ...this.pendingRequests,
                    [groupId]: requests
                };
                this.lastRequestCounts[groupId] = requests.length;
            },
            error: (err) => console.error('Erreur chargement demandes', err)
        });
    }

    // ==================== GESTION DES GROUPES ====================

    getPendingRequestsForSelectedGroup(): JoinRequestDTO[] {
        if (this.selectedGroup && this.pendingRequests[this.selectedGroup.id]) {
            return this.pendingRequests[this.selectedGroup.id];
        }
        return [];
    }

    createGroup() {
        if (!this.newGroup.name.trim()) return;
        this.newGroup.creatorId = this.auth.getCurrentUserId();
        this.newGroup.visibility = this.isPublicGroup ? 'PUBLIC' : 'PRIVATE';

        this.api.createGroup(this.newGroup).subscribe({
            next: () => {
                this.showCreateModal = false;
                this.newGroup = { name: '', description: '', creatorId: 0 }
                this.isPublicGroup = false;
                this.loadGroups();
            },
            error: (err) => console.error('Erreur création groupe', err)
        });
    }

    deleteGroup(groupId: number, groupName?: string): void {
        const name = groupName || 'ce groupe';

        Swal.fire({
            title: this.lang.t('groups.confirm_delete_group_title'),
            html: `${this.lang.t('groups.confirm_delete_group_text')}<br><strong>"${name}"</strong>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: this.lang.t('groups.confirm_delete_group_confirm'),
            cancelButtonText: this.lang.t('groups.confirm_delete_group_cancel'),
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#64748b',
            reverseButtons: true
        }).then((result) => {
            if (result.isConfirmed) {
                this.api.deleteGroup(groupId).subscribe({
                    next: () => {
                        this.loadGroups();
                        Swal.fire({
                            toast: true,
                            position: 'top-end',
                            icon: 'success',
                            title: this.lang.t('groups.group_deleted_success'),
                            text: `"${name}" ${this.lang.t('groups.group_deleted_success')}`,
                            showConfirmButton: false,
                            timer: 3000,
                            timerProgressBar: true
                        });
                    },
                    error: (err: any) => {
                        console.error('Erreur suppression groupe', err);
                        Swal.fire({
                            icon: 'error',
                            title: 'Erreur',
                            text: err.error?.message || this.lang.t('groups.group_deleted_error'),
                            confirmButtonText: this.lang.t('groups.cancel'),
                            confirmButtonColor: '#dc2626'
                        });
                    }
                });
            }
        });
    }

    // ==================== GESTION DES MEMBRES ====================

    openAddMemberModal(group: GroupResponseDTO) {
        this.selectedGroup = group;
        this.memberSearch = '';
        this.selectedUserId = 0;
        this.showAddMemberModal = true;
    }

    addMember(): void {
        if (this.selectedGroup && this.selectedUserId > 0) {
            const selectedUser = this.allUsers.find(u => u.id === this.selectedUserId);

            // Vérifier si l'utilisateur est déjà membre du groupe
            if (this.isMemberOfGroup(this.selectedGroup, this.selectedUserId)) {
                Swal.fire({
                    icon: 'warning',
                    title: this.lang.t('groups.already_member'),
                    text: `${selectedUser?.name} ${this.lang.t('groups.already_member_of_group')}`,
                    confirmButtonText: this.lang.t('groups.cancel'),
                    confirmButtonColor: '#64748b'
                });
                return;
            }

            this.api.addMember(this.selectedGroup.id, this.selectedUserId).subscribe({
                next: () => {
                    this.showAddMemberModal = false;
                    this.loadGroups();

                    Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'success',
                        title: `${selectedUser?.name} a rejoint le groupe "${this.selectedGroup?.name}"`,
                        showConfirmButton: false,
                        timer: 3000,
                        timerProgressBar: true
                    });

                    this.selectedUserId = 0;
                    this.memberSearch = '';
                },
                error: (err: any) => {
                    console.error('Erreur ajout membre', err);
                    Swal.fire({
                        icon: 'error',
                        title: 'Erreur',
                        text: err.error?.message || 'Impossible d\'ajouter le membre.',
                        confirmButtonText: 'OK',
                        confirmButtonColor: '#dc2626'
                    });
                }
            });
        }
    }

    async removeMember(groupId: number, userId: number) {
        const result = await Swal.fire({
            title: 'Confirmation',
            text: 'Retirer ce membre ?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Retirer',
            cancelButtonText: 'Annuler'
        });

        if (result.isConfirmed) {
            this.api.removeMember(groupId, userId).subscribe({
                next: () => {
                    this.loadGroups();
                    Swal.fire('Retiré!', 'Membre supprimé.', 'success');
                },
                error: (err) => console.error('Erreur suppression membre', err)
            });
        }
    }

    getFilteredUsers(): UserDTO[] {
        let filtered = this.allUsers.filter(u => u.id !== undefined && u.id !== null && u.id > 0);
        if (this.memberSearch) {
            const search = this.memberSearch.toLowerCase();
            filtered = filtered.filter(u =>
                u.name.toLowerCase().includes(search) ||
                u.email.toLowerCase().includes(search)
            );
        }
        return filtered;
    }

    selectUser(user: UserDTO): void {
        if (user.id) {
            this.selectedUserId = user.id;
        }
    }

    trackByUserId(index: number, user: UserDTO): number {
        return user.id ?? index;
    }

    // ==================== PARTAGE D'EXAMENS ====================

    openAddExamModal(group: GroupResponseDTO) {
        this.selectedGroup = group;
        this.loadAvailableExams();
        this.selectedExamCode = '';
        this.showAddExamModal = true;
    }

    shareExam(): void {
        if (this.selectedGroup && this.selectedExamCode) {
            const selectedExam = this.availableExams.find(e => e.codeExam === this.selectedExamCode);
            const examName = selectedExam?.description || this.selectedExamCode;

            // 1. Vérifier si l'examen est déjà partagé avec ce groupe
            const sharedExams = this.groupSharedExams[this.selectedGroup.id] || [];
            const isAlreadyShared = sharedExams.some(exam => exam.codeExam === this.selectedExamCode);

            if (isAlreadyShared) {
                Swal.fire({
                    icon: 'warning',
                    title: this.lang.t('groups.exam_already_shared'),
                    html: `${this.lang.t('groups.exam_already_shared_text')}<br><strong>"${examName}"</strong>`,
                    confirmButtonText: this.lang.t('groups.cancel'),
                    confirmButtonColor: '#64748b'
                });
                return;
            }


            Swal.fire({
                title: this.lang.t('groups.confirm_share_exam_title'),
                html: `${this.lang.t('groups.confirm_share_exam_text')}<br><strong>"${examName}"</strong> → <strong>${this.selectedGroup.name}</strong>`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: this.lang.t('groups.confirm_share_exam_confirm'),
                cancelButtonText: this.lang.t('groups.confirm_share_exam_cancel'),
                confirmButtonColor: '#2563eb',
                cancelButtonColor: '#64748b'
            }).then((result) => {
                if (result.isConfirmed) {
                    this.api.shareExamWithGroup({
                        examCode: this.selectedExamCode,
                        groupId: this.selectedGroup!.id,
                        adminId: this.auth.getCurrentUserId()
                    }).subscribe({
                        next: () => {
                            this.showAddExamModal = false;
                            this.loadGroupSharedExams(this.selectedGroup!.id);

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

                            this.selectedExamCode = '';
                        },
                        error: (err: any) => {
                            console.error('Erreur partage examen', err);
                            Swal.fire({
                                icon: 'error',
                                title: this.lang.t('groups.error_remove_exam'),
                                text: err.error?.message || this.lang.t('groups.exam_shared_error'),
                                confirmButtonText: this.lang.t('groups.cancel'),
                                confirmButtonColor: '#dc2626'
                            });
                        }
                    });
                }
            });
        }
    }

    viewExam(codeExam: string | undefined) {
        if (codeExam) {
            this.router.navigate(['/exams', codeExam]);
        }
    }

    removeExamFromGroup(groupId: number, examCode: string, examDescription?: string): void {
        const examName = examDescription || examCode;

        Swal.fire({
            title: this.lang.t('groups.confirm_remove_exam_title'),
            html: `${this.lang.t('groups.confirm_remove_exam_text')}<br><strong>"${examName}"</strong>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: this.lang.t('groups.confirm_remove_exam_confirm'),
            cancelButtonText: this.lang.t('groups.confirm_remove_exam_cancel'),
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#64748b'
        }).then((result) => {
            if (result.isConfirmed) {
                this.api.unshareExamFromGroup({
                    examCode: examCode,
                    groupId: groupId,
                    adminId: this.auth.getCurrentUserId()
                }).subscribe({
                    next: () => {
                        this.loadGroupSharedExams(groupId);
                        Swal.fire({
                            toast: true,
                            position: 'top-end',
                            icon: 'success',
                            title: this.lang.t('groups.exam_removed_toast'),
                            text: `"${examName}" ${this.lang.t('groups.exam_removed_success')}`,
                            showConfirmButton: false,
                            timer: 3000,
                            timerProgressBar: true
                        });
                    },
                    error: (err: any) => {
                        console.error('Erreur lors du retrait de l\'examen', err);
                        Swal.fire({
                            icon: 'error',
                            title: this.lang.t('groups.error_remove_exam'),
                            text: err.error?.message || this.lang.t('groups.exam_removed_error'),
                            confirmButtonText: this.lang.t('groups.cancel'),
                            confirmButtonColor: '#dc2626'
                        });
                    }
                });
            }
        });
    }

    // ==================== DEMANDES D'ADHÉSION ====================

    openRequestsModal(group: GroupResponseDTO) {
        this.selectedGroup = group;
        this.showRequestsModal = true;
    }

    acceptRequest(request: JoinRequestDTO) {
        this.api.acceptJoinRequest(request.id).subscribe({
            next: () => {
                const groupId = request.groupId;

                if (this.pendingRequests[groupId]) {
                    this.pendingRequests[groupId] = this.pendingRequests[groupId].filter(r => r.id !== request.id);
                    if (this.pendingRequests[groupId].length === 0) {
                        delete this.pendingRequests[groupId];
                    }
                }

                const group = this.myGroups.find(g => g.id === groupId);
                if (group) {
                    const newMember = {
                        id: request.userId,
                        name: request.userName,
                        email: request.userEmail
                    };
                    if (!group.members.some(m => m.id === request.userId)) {
                        group.members.push(newMember);
                        group.membersCount = (group.membersCount || 0) + 1;
                    }
                }

                this.cdr.detectChanges();
            },
            error: (err) => console.error('Erreur acceptation demande', err)
        });
    }

    rejectRequest(request: JoinRequestDTO) {
        this.api.rejectJoinRequest(request.id).subscribe({
            next: () => {
                const groupId = request.groupId;
                if (this.pendingRequests[groupId]) {
                    this.pendingRequests[groupId] = this.pendingRequests[groupId].filter(r => r.id !== request.id);
                    if (this.pendingRequests[groupId].length === 0) {
                        delete this.pendingRequests[groupId];
                    }
                }
                this.cdr.detectChanges();
            },
            error: (err) => console.error('Erreur refus demande', err)
        });
    }

    // ==================== MÉTHODES UTILITAIRES ====================

    isMemberOfGroup(group: GroupResponseDTO, userId: number): boolean {
        return group.members.some(m => m.id === userId);
    }

    isAdminOfGroup(group: GroupResponseDTO, userId: number): boolean {
        return group.admins.some(a => a.id === userId);
    }

    getSharedExams(group: GroupResponseDTO): ExamDTO[] {
        if (!group || !group.id) return [];
        return this.groupSharedExams[group.id] || [];
    }

    getPendingRequestsCount(group: GroupResponseDTO): number {
        if (!group || !group.id) return 0;
        return this.pendingRequests[group.id]?.length || 0;
    }

    getPendingRequests(group: GroupResponseDTO): JoinRequestDTO[] {
        if (!group || !group.id) return [];
        return this.pendingRequests[group.id] || [];
    }

    hasPendingRequests(group: GroupResponseDTO): boolean {
        return this.getPendingRequestsCount(group) > 0;
    }

    private getUserName(userId: number): Observable<string> {
        if (this.userCache[userId]) {
            return of(this.userCache[userId]);
        }
        return this.api.getUser(userId).pipe(
            map(user => {
                this.userCache[userId] = user.name;
                return user.name;
            })
        );
    }

    getExamCreatorName(exam: ExamDTO): string {
        return (exam as any).creatorName || this.lang.t('groups.unknown_creator');
    }

    trackByGroupId(index: number, group: GroupResponseDTO): number {
        return group?.id ?? index;
    }

    toggleGroupVisibility(group: GroupResponseDTO) {
        const newVisibility = group.visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC';

        this.api.updateGroupVisibility(group.id, newVisibility).subscribe({
            next: (updatedGroup: GroupResponseDTO) => {
                const index = this.myGroups.findIndex(g => g.id === group.id);
                if (index !== -1) {
                    this.myGroups[index] = updatedGroup;
                }
                const allIndex = this.allGroups?.findIndex(g => g.id === group.id);
                if (allIndex !== -1 && this.allGroups) {
                    this.allGroups[allIndex] = updatedGroup;
                }
            },
            error: (err) => {
                console.error('Erreur lors du changement de visibilité', err);
                Swal.fire({
                    icon: 'error',
                    title: 'Erreur',
                    text: this.lang.t('groups.visibility_error'),
                    confirmButtonText: 'OK'
                });
            }
        });
    }
}