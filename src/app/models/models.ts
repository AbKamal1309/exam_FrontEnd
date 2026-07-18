export interface UserDTO {
  id?: number;
  name: string;
  email: string;
  password?: string;
  roles?: string[];
}

// ===================== ANSWER =====================
export type AnswerStatus = 'CORRECT' | 'WRONG';

export interface AnswerDTO {
  codeAnswer?: string;
  answerContent: string;
  answerStatus: 'CORRECT' | 'WRONG';
  description?: string;
  questionId?: string;
}


// ===================== QUESTION =====================
export type AttachmentType = 'PDF' | 'WORD' | 'IMAGE' | 'VIDEO'| 'AUDIO';

export interface UploadResultDTO {
  url: string;
  type: AttachmentType;
  name: string;
}


export interface QuestionDTO {
  codeQuestion?: string;
  questionContent: string;
  description?: string;
  examId?: string;
  answers?: AnswerDTO[];
  attachmentUrl?: string;
  attachmentType?: AttachmentType;
  attachmentName?: string;
}

// ===================== EXAM =====================
export type ExamStatus = 'CREATED' | 'ACTIVATED' | 'SUSPENDED';
export type ExamVisibility = 'PUBLIC' | 'PRIVATE';  // Ajouter ce type



export interface ExamDTO {
  codeExam?: string;
  dateCreation?: string;
  numberOfQuestions?: number;
  status?: ExamStatus;
  visibility?: ExamVisibility;
  description?: string;
  userId?: number;
  userName?: string;
  questionDTOList?: QuestionDTO[];
    durationMinutes?: number;
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
  previousTests?: TestResultDTO[];
  testStartTime?: string;
  serverTime?: string;
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
  scorePercentage?: number;
  totalQuestions?: number;
  correctAnswers?: number;
  wrongAnswers?: number;
  datePassed?: string;
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


// Ajouter ces interfaces à la fin du fichier

// ===================== GROUPES =====================
export interface GroupRequestDTO {
  name: string;
  description?: string;
  creatorId: number;
  visibility?: 'PUBLIC' | 'PRIVATE';
}

export interface GroupResponseDTO {
  id: number;
  name: string;
  description: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  createdAt: string;
  creatorId: number;
  creatorName: string;
  membersCount: number;
  adminsCount: number;
  members: UserSummaryDTO[];
  admins: UserSummaryDTO[];
}

export interface UserSummaryDTO {
  id: number;
  name: string;
  email: string;
}

export interface ShareExamWithGroupDTO {
  examCode: string;
  groupId: number;
  adminId: number;
}

export interface JoinGroupRequestDTO {
  groupId: number;
  userId: number;
}

export interface JoinRequestDTO {
  id: number;
  groupId: number;
  userId: number;
  userName: string;
  userEmail: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  requestDate: string;
}



// Ajouter cette interface
export interface TestCorrectionDTO {
  questionContent: string;
  userAnswer: string;
  userAnswerId?: string;
  correctAnswer: string;
  correctAnswerId?: string;
  isCorrect: boolean;
  explanation?: string;
}