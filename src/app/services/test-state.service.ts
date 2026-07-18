// src/app/services/test-state.service.ts
import { Injectable } from '@angular/core';
import { TestResultDTO, QuestionDTO } from '../models/models';

@Injectable({ providedIn: 'root' })
export class TestStateService {
    private readonly TEST_RESULT_KEY = 'test_correction_result';
    private readonly SUBMITTED_QUESTIONS_KEY = 'test_correction_questions';

    setTestResult(result: TestResultDTO) {
        localStorage.setItem(this.TEST_RESULT_KEY, JSON.stringify(result));
    }

    getTestResult(): TestResultDTO | null {
        const data = localStorage.getItem(this.TEST_RESULT_KEY);
        return data ? JSON.parse(data) : null;
    }

    setSubmittedQuestions(questions: QuestionDTO[]) {
        localStorage.setItem(this.SUBMITTED_QUESTIONS_KEY, JSON.stringify(questions));
    }

    getSubmittedQuestions(): QuestionDTO[] {
        const data = localStorage.getItem(this.SUBMITTED_QUESTIONS_KEY);
        return data ? JSON.parse(data) : [];
    }

    clear() {
        localStorage.removeItem(this.TEST_RESULT_KEY);
        localStorage.removeItem(this.SUBMITTED_QUESTIONS_KEY);
    }
}