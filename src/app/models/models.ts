export interface UserDTO {
  id?: number;
  name: string;
  email: string;
  password?: string;
}

// ===================== ANSWER =====================
export type AnswerStatus = 'CORRECT' | 'WRONG';

export interface AnswerDTO {
  codeAnswer?: string;
  answerContent: string;
  answerStatus: AnswerStatus;
  description?: string;
  questionId?: string;
}

// ===================== QUESTION =====================
export interface QuestionDTO {
  codeQuestion?: string;
  questionContent: string;
  description?: string;
  examId?: string;
  answers?: AnswerDTO[];
}

// ===================== EXAM =====================
export type ExamStatus = 'CREATED' | 'ACTIVATED' | 'SUSPENDED';

export interface ExamDTO {
  codeExam?: string;
  dateCreation?: string;
  numberOfQuestions?: number;
  status?: ExamStatus;
  description?: string;
  userId?: number;
  questionDTOList?: QuestionDTO[];
}

// ===================== TEST =====================
export interface TestRequestDTO {
  userId: number;
  codeExam: string;
}

export interface TestExamDTO {
  userRequestName?: string;
  codeExam?: string;
  userNameExamSetter?: string;
  examDTO?: ExamDTO;
}

export interface TestSendDTO {
  userId: number;
  codeExam: string;
  questionDTOS: QuestionDTO[];
}

export interface TestResultDTO {
  testId?: string;
  examId?: string;
  userNameTest?: string;
  userNameExamSetter?: string;
  score?: number;
}

// ===================== DASHBOARD =====================
export interface RequestTestScoreDTO {
  testId: string;
}

export interface ResponseTestScoreDTO {
  testId?: string;
  userName?: string;
  examSetName?: string;
  score?: number;
  numberOfQuestions?: number;
  numberOfFailedQuestions?: number;
  numberOfSucceededQuestions?: number;
  failedQuestions?: QuestionDTO[];
}

export interface BestScoreDTO {
  examId?: string;
  testId?: string;
  bestScore?: number;
  name?: string;
}

export interface RequestAllTestExam {
  examId: string;
}

export interface ResponseAllTestExam {
  testExamDTOList?: TestResultDTO[];
}

export interface ResponseAllTestUser {
  testResultDTOList?: TestResultDTO[];
}
