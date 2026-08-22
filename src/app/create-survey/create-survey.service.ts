import { inject, Injectable, } from '@angular/core';
import { Supabase } from '../supabase';
import type { CreateSurvey as CreateSurveyPayload } from '../supabase';

export interface Answer { text: string; }
export interface Question { text: string; answers: Answer[]; multipleAnswers: boolean; }

export interface SurveyDraft { surveyName: string; surveyEndDate: string; surveyDescription: string; questions: Question[]; }

/** Handles survey drafts, date formatting, and publishing. */
@Injectable({
    providedIn: 'root',
})

export class CreateSurveyService {
    private readonly draftKey = 'create-survey-draft';
    private readonly supabase = inject(Supabase);

    /**
     * Publishes a completed survey.
     * @param draft Survey data to publish.
     * @param category Selected survey category.
     * @returns ID of the created survey.
     */
    async publishSurvey(
        draft: SurveyDraft,
        category: string
    ): Promise<number> {
        const survey = this.createSurveyPayload(
            draft,
            category
        );

        return this.supabase.createSurvey(survey);
    }

    /** Saves the current survey draft. */
    saveDraft(draft: SurveyDraft): void {
        sessionStorage.setItem(
            this.draftKey,
            JSON.stringify(draft)
        );
    }

    /** Loads the saved survey draft. */
    loadDraft(): SurveyDraft | null {
        const savedDraft =
            sessionStorage.getItem(this.draftKey);

        if (!savedDraft) {
            return null;
        }

        return JSON.parse(savedDraft) as SurveyDraft;
    }

    /** Removes the saved survey draft. */
    clearDraft(): void {
        sessionStorage.removeItem(this.draftKey);
    }

    /** Formats numeric input as DD.MM.YYYY. */
    formatEndDate(value: string): string {
        const digits = value
            .replace(/\D/g, '')
            .slice(0, 8);

        return this.addDateDots(digits);
    }

    /** Completes a date containing a two-digit year. */
    completeEndDate(value: string): string {
        const digits = value.replace(/\D/g, '');
        const completedDigits = this.completeYear(digits);

        return this.addDateDots(completedDigits);
    }

    /**
     * Rejects invalid or past dates.
     * @param value Date in DD.MM.YYYY format.
     * @returns Valid date value or an empty string.
     */
    validateEndDate(value: string): string {
        if (!value) {
            return '';
        }

        const date = this.parseEndDate(value);
        const today = this.getToday();

        return date && date >= today ? value : '';
    }

    /** Prepares the complete database payload. */
    private createSurveyPayload(
        draft: SurveyDraft,
        category: string
    ): CreateSurveyPayload {
        const endDate = this.toDatabaseDate(draft.surveyEndDate);
        const questions = this.prepareQuestions(draft.questions);

        return this.buildSurveyPayload(
            draft,
            category,
            endDate,
            questions
        );
    }

    /** Builds the final survey payload. */
    private buildSurveyPayload(
        draft: SurveyDraft,
        category: string,
        endDate: string | null,
        questions: Question[]
    ): CreateSurveyPayload {
        return {
            title: draft.surveyName.trim(),
            description: draft.surveyDescription.trim(),
            category,
            endDate,
            questions,
        };
    }

    /** Trims all question and answer values. */
    private prepareQuestions(
        questions: Question[]
    ): Question[] {
        return questions.map((question) => ({
            text: question.text.trim(),
            multipleAnswers: question.multipleAnswers,
            answers: question.answers.map((answer) => ({
                text: answer.text.trim(),
            })),
        }));
    }

    /** Converts DD.MM.YYYY to YYYY-MM-DD. */
    private toDatabaseDate(value: string): string | null {
        if (!value) {
            return null;
        }

        const [day, month, year] = value.split('.');

        return `${year}-${month}-${day}`;
    }

    /** Adds 20 to a two-digit year. */
    private completeYear(digits: string): string {
        if (digits.length !== 6) {
            return digits;
        }

        return `${digits.slice(0, 4)}20${digits.slice(4)}`;
    }

    /** Adds dots to numeric date input. */
    private addDateDots(digits: string): string {
        const parts = [
            digits.slice(0, 2),
            digits.slice(2, 4),
            digits.slice(4, 8),
        ];

        return parts.filter(Boolean).join('.');
    }

    /** Returns today without a time value. */
    private getToday(): Date {
        const today = new Date();

        today.setHours(0, 0, 0, 0);

        return today;
    }

    /** Parses DD.MM.YYYY or returns null. */
    private parseEndDate(value: string): Date | null {
        const [day, month, year] =
            value.split('.').map(Number);

        const date = new Date(year, month - 1, day);

        return this.isValidDate(date, day, month, year)
            ? date
            : null;
    }

    /**
     * Checks whether a date matches its original values.
     * @param date Date object to validate.
     * @param day Expected day.
     * @param month Expected month.
     * @param year Expected year.
     * @returns Whether the date is valid.
     */
    private isValidDate(
        date: Date,
        day: number,
        month: number,
        year: number
    ): boolean {
        return (
            year >= 1000 &&
            date.getDate() === day &&
            date.getMonth() === month - 1 &&
            date.getFullYear() === year
        );
    }
}