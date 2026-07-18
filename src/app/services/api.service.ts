import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  UserDTO, ExamDTO, QuestionDTO, AnswerDTO,
  TestRequestDTO, TestExamDTO, TestSendDTO, TestResultDTO,
  RequestTestScoreDTO, ResponseTestScoreDTO, BestScoreDTO,
  RequestAllTestExam, ResponseAllTestExam, ResponseAllTestUser, JoinRequestDTO, GroupResponseDTO,
  ShareExamWithGroupDTO, GroupRequestDTO, TestCorrectionDTO,UploadResultDTO,
} from '../models/models';

// Réponse renvoyée par POST /auth/login et POST /auth/refresh
export interface AuthResponse {
  user: UserDTO;
  accessToken: string;
  refreshToken: string;
}

// Requête pour POST /ai/generate-questions
export interface GenerateQuestionsRequest {
  subject: string;
  level?: string;
  numberOfQuestions: number;
  language: 'fr' | 'ar';
  allowMultipleCorrectAnswers: boolean;
  difficulty: 'FACILE' | 'MOYEN' | 'AVANCE';
}

// Réponse de GET /admin/stats
export interface AdminStats {
  totalUsers: number;
  totalExams: number;
  totalGroups: number;
  totalQuestions: number;
  totalTestsPassed: number;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = 'http://localhost:8085';

  constructor(private http: HttpClient) {}

  // ===== USERS =====
  getUsers(): Observable<UserDTO[]> {
    return this.http.get<UserDTO[]>(`${this.base}/users`);
  }
  getUser(id: number): Observable<UserDTO> {
    return this.http.get<UserDTO>(`${this.base}/users/${id}`);
  }
  saveUser(user: UserDTO): Observable<UserDTO> {
    return this.http.post<UserDTO>(`${this.base}/users`, user);
  }
  updateUser(userId: number, user: UserDTO): Observable<UserDTO> {
    return this.http.put<UserDTO>(`${this.base}/users/${userId}`, user);
  }
  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/users/${id}`);
  }

  /** @deprecated remplacé par authLogin() — POST /auth/login renvoie désormais les tokens JWT */
  login(user: UserDTO): Observable<UserDTO> {
    return this.http.post<UserDTO>(`${this.base}/login`, user);
  }

  // ===== AUTH (JWT) =====
  authLogin(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/auth/login`, credentials);
  }
  refreshToken(refreshToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/auth/refresh`, { refreshToken });
  }
  googleAuthLogin(idToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/auth/google`, { idToken });
  }

  // ===== IA =====
  generateQuestionsWithAi(request: GenerateQuestionsRequest, file?: File | null): Observable<QuestionDTO[]> {
    const formData = new FormData();
    formData.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }));
    if (file) {
      formData.append('file', file);
    }
    return this.http.post<QuestionDTO[]>(`${this.base}/ai/generate-questions`, formData);
  }

  // ===== ADMIN =====
  getAdminStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.base}/admin/stats`);
  }
  promoteToAdmin(userId: number): Observable<void> {
    return this.http.post<void>(`${this.base}/admin/users/${userId}/promote`, {});
  }
  demoteFromAdmin(userId: number): Observable<void> {
    return this.http.post<void>(`${this.base}/admin/users/${userId}/demote`, {});
  }
  adminDeleteExam(codeExam: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/exams/${codeExam}`);
  }
  adminDeleteGroup(groupId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/groups/${groupId}`);
  }

  // ===== EXAMS =====
  getExams(): Observable<ExamDTO[]> {
    return this.http.get<ExamDTO[]>(`${this.base}/exams`);
  }
  getExam(id: string): Observable<ExamDTO> {
    return this.http.get<ExamDTO>(`${this.base}/exams/${id}`);
  }
  getExamsForUser(userId: number): Observable<ExamDTO[]> {
    return this.http.get<ExamDTO[]>(`${this.base}/examsOfUser/${userId}`);
  }
  getPublicExams(): Observable<ExamDTO[]> {
    return this.http.get<ExamDTO[]>(`${this.base}/exams/public`);
  }
  saveExam(exam: ExamDTO): Observable<ExamDTO> {
    return this.http.post<ExamDTO>(`${this.base}/exams`, exam);
  }
  createExam(exam: ExamDTO): Observable<ExamDTO> {
    return this.http.post<ExamDTO>(`${this.base}/exams`, exam);
  }
  saveExamAllQuestionsAndAnswers(userId: number, exam: ExamDTO): Observable<ExamDTO> {
    return this.http.post<ExamDTO>(`${this.base}/examAllQuestionsAndAnswers/${userId}`, exam);
  }
  updateExam(codeExam: string, exam: ExamDTO): Observable<ExamDTO> {
    return this.http.put<ExamDTO>(`${this.base}/exams/${codeExam}`, exam);
  }

  deleteExam(codeExam: string, userId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/exams/${codeExam}`, {
      params: { userId: userId.toString() }
    });
  }

  updateVisibility(codeExam: string, visibility: 'PUBLIC' | 'PRIVATE', userId: number) {
    return this.http.patch<ExamDTO>(
        `${this.base}/exams/${codeExam}/visibility`,
        null,
        { params: { visibility, userId } }
    );
  }

  // ===== QUESTIONS =====
  getAllQuestions(): Observable<QuestionDTO[]> {
    return this.http.get<QuestionDTO[]>(`${this.base}/questions`);
  }
  getQuestion(codeQuestion: string): Observable<QuestionDTO> {
    return this.http.get<QuestionDTO>(`${this.base}/questions/${codeQuestion}`);
  }
  getQuestionsForExam(codeExam: string): Observable<QuestionDTO[]> {
    return this.http.get<QuestionDTO[]>(`${this.base}/exams/${codeExam}/questions`);
  }
  saveQuestion(question: QuestionDTO): Observable<QuestionDTO> {
    return this.http.post<QuestionDTO>(`${this.base}/question`, question);
  }
  saveQuestionAndAnswers(question: QuestionDTO): Observable<QuestionDTO> {
    return this.http.post<QuestionDTO>(`${this.base}/questionAndAnswers`, question);
  }
  updateQuestion(codeQuestion: string, question: QuestionDTO): Observable<QuestionDTO> {
    return this.http.put<QuestionDTO>(`${this.base}/question/${codeQuestion}`, question);
  }
  updateQuestionWithAnswers(codeQuestion: string, question: QuestionDTO): Observable<QuestionDTO> {
    return this.http.put<QuestionDTO>(`${this.base}/questionAndAnswers/${codeQuestion}`, question);
  }

  // ===== ANSWERS =====
  getAllAnswers(): Observable<AnswerDTO[]> {
    return this.http.get<AnswerDTO[]>(`${this.base}/answers`);
  }
  getAnswer(codeAnswer: string): Observable<AnswerDTO> {
    return this.http.get<AnswerDTO>(`${this.base}/${codeAnswer}`);
  }
  getAnswersForQuestion(codeQuestion: string): Observable<AnswerDTO[]> {
    return this.http.get<AnswerDTO[]>(`${this.base}/answers/${codeQuestion}`);
  }
  saveAnswer(answer: AnswerDTO): Observable<AnswerDTO> {
    return this.http.post<AnswerDTO>(`${this.base}/answer`, answer);
  }
  updateAnswer(codeAnswer: string, answer: AnswerDTO): Observable<AnswerDTO> {
    return this.http.put<AnswerDTO>(`${this.base}/answer/${codeAnswer}`, answer);
  }

  // ===== TEST =====
  getTestExam(req: TestRequestDTO): Observable<TestExamDTO> {
    const params = new HttpParams()
      .set('userId', req.userId.toString())
      .set('codeExam', req.codeExam);
    return this.http.get<TestExamDTO>(`${this.base}/test`, { params });
  }
  sendTest(testSend: TestSendDTO): Observable<TestResultDTO> {
    return this.http.post<TestResultDTO>(`${this.base}/test`, testSend);
  }

  // ===== DASHBOARD =====
  getScore(testId: string): Observable<ResponseTestScoreDTO> {
    const params = new HttpParams().set('testId', testId);
    return this.http.get<ResponseTestScoreDTO>(`${this.base}/dashboard/score`, { params });
  }
  getPopularExams(): Observable<string[]> {
    return this.http.get<string[]>(`${this.base}/dashboard/popularExams`);
  }
  getBestScore(examId: string): Observable<BestScoreDTO> {
    return this.http.get<BestScoreDTO>(`${this.base}/dashboard/bestScore/${examId}`);
  }
  getBestScoreName(examId: string): Observable<string> {
    return this.http.get<string>(`${this.base}/dashboard/bestScoreName/${examId}`);
  }
  getAllTestsForExam(examId: string): Observable<ResponseAllTestExam> {
    const params = new HttpParams().set('examId', examId);
    return this.http.get<ResponseAllTestExam>(`${this.base}/dashboard/allTestForExam`, { params });
  }

  getAllTestForUser(userId: number): Observable<ResponseAllTestUser> {
    return this.http.get<ResponseAllTestUser>(`${this.base}/dashboard/allTestForExam/${userId}`);
  }

  // ===== GROUPES =====
  getAllGroups(): Observable<GroupResponseDTO[]> {
    return this.http.get<GroupResponseDTO[]>(`${this.base}/groups`);
  }

  getGroup(groupId: number): Observable<GroupResponseDTO> {
    return this.http.get<GroupResponseDTO>(`${this.base}/groups/${groupId}`);
  }

  getGroupsByMember(userId: number): Observable<GroupResponseDTO[]> {
    return this.http.get<GroupResponseDTO[]>(`${this.base}/groups/member/${userId}`);
  }

  getGroupsByCreator(creatorId: number): Observable<GroupResponseDTO[]> {
    return this.http.get<GroupResponseDTO[]>(`${this.base}/groups/creator/${creatorId}`);
  }

  getGroupSharedExams(groupId: number, userId: number): Observable<ExamDTO[]> {
    return this.http.get<ExamDTO[]>(`${this.base}/groups/${groupId}/exams?userId=${userId}`);
  }

  getPublicGroups(): Observable<GroupResponseDTO[]> {
    return this.http.get<GroupResponseDTO[]>(`${this.base}/groups/public`);
  }

  searchGroups(keyword: string): Observable<GroupResponseDTO[]> {
    return this.http.get<GroupResponseDTO[]>(`${this.base}/groups/search?keyword=${keyword}`);
  }

  createGroup(group: GroupRequestDTO): Observable<GroupResponseDTO> {
    return this.http.post<GroupResponseDTO>(`${this.base}/groups`, group);
  }

  deleteGroup(groupId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/groups/${groupId}`);
  }

  addMember(groupId: number, userId: number): Observable<GroupResponseDTO> {
    return this.http.post<GroupResponseDTO>(`${this.base}/groups/${groupId}/members/${userId}`, {});
  }

  removeMember(groupId: number, userId: number): Observable<GroupResponseDTO> {
    return this.http.delete<GroupResponseDTO>(`${this.base}/groups/${groupId}/members/${userId}`);
  }

  addAdmin(groupId: number, userId: number): Observable<GroupResponseDTO> {
    return this.http.post<GroupResponseDTO>(`${this.base}/groups/${groupId}/admins/${userId}`, {});
  }

  removeAdmin(groupId: number, userId: number): Observable<GroupResponseDTO> {
    return this.http.delete<GroupResponseDTO>(`${this.base}/groups/${groupId}/admins/${userId}`);
  }

  shareExamWithGroup(shareData: ShareExamWithGroupDTO): Observable<GroupResponseDTO> {
    return this.http.post<GroupResponseDTO>(`${this.base}/groups/share-exam`, shareData);
  }

  unshareExamFromGroup(shareData: ShareExamWithGroupDTO): Observable<GroupResponseDTO> {
    return this.http.delete<GroupResponseDTO>(`${this.base}/groups/share-exam`, { body: shareData });
  }

  sendJoinRequest(groupId: number): Observable<JoinRequestDTO> {
    return this.http.post<JoinRequestDTO>(`${this.base}/groups/${groupId}/join-requests`, {});
  }

  getPendingJoinRequests(groupId: number): Observable<JoinRequestDTO[]> {
    return this.http.get<JoinRequestDTO[]>(`${this.base}/groups/${groupId}/join-requests/pending`);
  }

  acceptJoinRequest(requestId: number): Observable<JoinRequestDTO> {
    return this.http.post<JoinRequestDTO>(`${this.base}/groups/join-requests/${requestId}/accept`, {});
  }

  rejectJoinRequest(requestId: number): Observable<JoinRequestDTO> {
    return this.http.post<JoinRequestDTO>(`${this.base}/groups/join-requests/${requestId}/reject`, {});
  }

  getUserPendingRequests(userId: number): Observable<JoinRequestDTO[]> {
    return this.http.get<JoinRequestDTO[]>(`${this.base}/groups/user/${userId}/pending-requests`);
  }

  updateGroupVisibility(groupId: number, visibility: 'PUBLIC' | 'PRIVATE'): Observable<GroupResponseDTO> {
    return this.http.patch<GroupResponseDTO>(`${this.base}/groups/${groupId}/visibility?visibility=${visibility}`, {});
  }

  getTestCorrection(testId: string): Observable<TestCorrectionDTO[]> {
    return this.http.get<TestCorrectionDTO[]>(`${this.base}/test/${testId}/correction`);
  }

  getTestResult(testId: string): Observable<TestResultDTO> {
    return this.http.get<TestResultDTO>(`${this.base}/test/result/${testId}`);
  }

  uploadQuestionAttachment(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UploadResultDTO>(`${this.base}/questions/upload`, formData);
  }

  getFileUrl(relativePath: string | undefined | null): string {
    if (!relativePath) return '';
    if (relativePath.startsWith('http')) return relativePath;
    return `${this.base}${relativePath}`;
  }
}
