import { inject, Injectable } from '@angular/core';
import { Supabase } from '../supabase';
import type { CreateSurvey as CreateSurveyPayload } from '../supabase';

const MIN_ANSWER_COUNT = 2;

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

/** Handles survey drafts, validation, and publishing. */
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
        category: string): Promise<number> {
        const survey = this.createSurveyPayload(
            draft,
            category
        );

        return this.supabase.createSurvey(survey);
    }

/**
* Saves the current survey draft.
* @param draft Current survey draft.
*/
    saveDraft(draft: SurveyDraft): void {
        sessionStorage.setItem(this.draftKey, JSON.stringify(draft));
    }
    
/**
* Loads the saved survey draft.
* @returns Saved draft or null.
*/
    loadDraft(): SurveyDraft | null {
        const savedDraft = sessionStorage.getItem(this.draftKey);

        if (!savedDraft) return null;

        return JSON.parse(savedDraft) as SurveyDraft;
    }

/** Removes the saved survey draft. */
    clearDraft(): void {
        sessionStorage.removeItem(this.draftKey);
    }

/**
* Checks whether all required fields are valid.
* @param draft Current survey draft.
* @param category Selected survey category.
* @returns Whether the survey is valid.
*/
    isSurveyValid(
        draft: SurveyDraft,
        category: string | null): boolean {

        return (
            draft.surveyName.trim().length > 0 &&
            category !== null &&
            this.areQuestionsValid(draft.questions)
        );
    }

/**
* Returns today's date for the date picker.
* @returns Today's date in YYYY-MM-DD format.
*/
    getTodayDate(): string {
        return new Date()
            .toISOString()
            .split('T')[0];
    }
    
/**
* Validates a date picker value.
* @param value Selected date.
* @returns Valid date or an empty string.
*/
    validatePickerDate(value: string): string {
        if (!value) return '';

        return value < this.getTodayDate()
            ? ''
            : value;
    }

/**
* Prepares the database payload.
* @param draft Current survey draft.
* @param category Selected survey category.
* @returns Prepared survey payload.
*/
    private createSurveyPayload(
        draft: SurveyDraft,
        category: string): CreateSurveyPayload {

        return {
            title: draft.surveyName.trim(),
            description: draft.surveyDescription.trim(),
            category,
            endDate: this.toDatabaseDate(draft.surveyEndDate),
            questions: this.prepareQuestions(draft.questions),
        };
    }

/**
* Trims all questions and answers.
* @param questions Survey questions.
* @returns Prepared questions.
*/
    private prepareQuestions(
        questions: Question[]): Question[] {

        return questions.map((question) => ({
            text: question.text.trim(),
            multipleAnswers: question.multipleAnswers,
            answers: question.answers.map((answer) => ({
                text: answer.text.trim(),
            })),
        }));
    }

/**
* Converts the picker value for the database.
* @param value Date picker value.
* @returns Database date or null.
*/
    private toDatabaseDate(
        value: string): string | null {
        return value || null;
    }

/**
* Checks whether every question is valid.
* @param questions Survey questions.
* @returns Whether every question is valid.
*/
    private areQuestionsValid(
        questions: Question[]): boolean {

        return questions.every((question) =>
            this.isQuestionValid(question)
        );
    }

/**
* Checks one survey question.
* @param question Survey question.
* @returns Whether the question is valid.
*/
    private isQuestionValid(
        question: Question): boolean {

        return (
            question.text.trim().length > 0 &&
            question.answers.length >= MIN_ANSWER_COUNT &&
            question.answers.every((answer) =>
                answer.text.trim().length > 0
            )
        );
    }
}