import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  UserDTO, ExamDTO, QuestionDTO, AnswerDTO,
  TestRequestDTO, TestExamDTO, TestSendDTO, TestResultDTO,
  RequestTestScoreDTO, ResponseTestScoreDTO, BestScoreDTO,
  RequestAllTestExam, ResponseAllTestExam, ResponseAllTestUser
} from '../models/models';

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
  login(user: UserDTO): Observable<UserDTO> {
    return this.http.post<UserDTO>(`${this.base}/login`, user);
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
  saveExam(exam: ExamDTO): Observable<ExamDTO> {
    return this.http.post<ExamDTO>(`${this.base}/exams`, exam);
  }
  saveExamAllQuestionsAndAnswers(userId: number, exam: ExamDTO): Observable<ExamDTO> {
    return this.http.post<ExamDTO>(`${this.base}/examAllQuestionsAndAnswers/${userId}`, exam);
  }
  updateExam(codeExam: string, exam: ExamDTO): Observable<ExamDTO> {
    return this.http.put<ExamDTO>(`${this.base}/exams/${codeExam}`, exam);
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
  getAllTestForExam(examId: string): Observable<ResponseAllTestExam> {
    const params = new HttpParams().set('examId', examId);
    return this.http.get<ResponseAllTestExam>(`${this.base}/dashboard/allTestForExam`, { params });
  }
  getAllTestForUser(userId: number): Observable<ResponseAllTestUser> {
    return this.http.get<ResponseAllTestUser>(`${this.base}/dashboard/allTestForExam/${userId}`);
  }
}
