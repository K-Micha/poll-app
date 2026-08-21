import { Injectable } from '@angular/core';

export interface Answer {
    text: string;
}

export interface Question {
    text: string;
    answers: Answer[];
    multipleAnswers: boolean;
}

export interface SurveyDraft {
    surveyName: string;
    surveyEndDate: string;
    surveyDescription: string;
    questions: Question[];
}

@Injectable({
    providedIn: 'root',
})
export class CreateSurveyService {
    private readonly draftKey = 'create-survey-draft';

    saveDraft(draft: SurveyDraft): void {
        sessionStorage.setItem(
            this.draftKey,
            JSON.stringify(draft)
        );
    }

    loadDraft(): SurveyDraft | null {
        const savedDraft =
            sessionStorage.getItem(this.draftKey);

        if (!savedDraft) return null;

        return JSON.parse(savedDraft) as SurveyDraft;
    }

    clearDraft(): void {
        sessionStorage.removeItem(this.draftKey);
    }

    formatEndDate(value: string): string {
        const digits = value
            .replace(/\D/g, '')
            .slice(0, 8);

        return this.addDateDots(digits);
    }

    completeEndDate(value: string): string {
        const digits = value.replace(/\D/g, '');
        const completedDigits = this.completeYear(digits);

        return this.addDateDots(completedDigits);
    }

    private completeYear(digits: string): string {
        if (digits.length !== 6) {
            return digits;
        }

        return `${digits.slice(0, 4)}20${digits.slice(4)}`;
    }

    validateEndDate(value: string): string {
        if (!value) return '';

        const date = this.parseEndDate(value);
        const today = new Date();

        today.setHours(0, 0, 0, 0);

        return date && date >= today ? value : '';
    }

    private addDateDots(digits: string): string {
        const parts = [
            digits.slice(0, 2),
            digits.slice(2, 4),
            digits.slice(4, 8)
        ];

        return parts.filter(Boolean).join('.');
    }

    private parseEndDate(value: string): Date | null {
        const [day, month, year] =
            value.split('.').map(Number);

        const date = new Date(year, month - 1, day);

        return this.isValidDate(date, day, month, year)
            ? date
            : null;
    }

    private isValidDate(date: Date, day: number, month: number, year: number): boolean {
        return (
            year >= 1000 &&
            date.getDate() === day &&
            date.getMonth() === month - 1 &&
            date.getFullYear() === year
        );
    }
}