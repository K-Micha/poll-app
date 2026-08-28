import { Component, inject, OnDestroy, OnInit, Renderer2, signal, } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Supabase } from '../supabase';
import { SurveyResults } from '../shared/components/survey-results/survey-results';
import { Header } from '../shared/layout/header/header';
import { Survey } from './survey-detail.types';
import { SurveyDetailService } from './survey-detail.service';

const NEXT_DAY_OFFSET = 1;
const FIRST_ANSWER_LETTER_CODE = 65;

@Component({
  selector: 'app-survey-detail',
  imports: [SurveyResults, Header, RouterLink],
  templateUrl: './survey-detail.html',
  styleUrls: [
    './survey-detail.scss',
    './survey-detail-media.scss',
  ],
})

/** Controls survey participation and answer submission. */
export class SurveyDetail implements OnInit, OnDestroy {
  private readonly supabaseService = inject(Supabase);
  private readonly renderer = inject(Renderer2);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly surveyDetailService = inject(SurveyDetailService);
  readonly isVoteSuccessOpen = signal(false);

  showResults = false;
  survey = signal<Survey | null>(null);
  selectedAnswers = signal<Record<number, number[]>>({});
  isSubmitting = signal(false);

/** Toggles the survey results visibility. */
  toggleResults(): void {
    this.showResults = !this.showResults;
  }

/** Loads the selected survey when the component starts. */
  async ngOnInit(): Promise<void> {
    this.renderer.addClass(document.body, 'body--detail');
    await this.loadSurvey();
  }

/** Loads the survey from the database. */
  private async loadSurvey(): Promise<void> {
    const response = await this.getSurvey();

    if (response.error) {
      console.error('Could not load survey:', response.error);
      return;
    }

    this.survey.set(response.data);
  }

/**
* Creates the database query for the current survey.
* @returns Database request for the current survey.
*/
  private getSurvey() {
    const surveyId = Number(
      this.route.snapshot.paramMap.get('id')
    );

    return this.supabaseService.supabase
      .from('surveys')
      .select('*, questions (*, answers (*))')
      .eq('id', surveyId)
      .single<Survey>();
  }/**
* Handles the selection of a survey answer.
* @param questionId ID of the selected question.
* @param answerId ID of the selected answer.
* @param allowMultiple Whether multiple answers are allowed.
* @param event Change event of the answer input.
*/
  selectAnswer(
    questionId: number,
    answerId: number,
    allowMultiple: boolean,
    event: Event): void {

    const input = event.target as HTMLInputElement;

    this.updateSelectedAnswers(
      questionId,
      answerId,
      allowMultiple,
      input.checked
    );
  }

/**
* Updates the selected answers of a question.
* @param questionId ID of the selected question.
* @param answerId ID of the selected answer.
* @param allowMultiple Whether multiple answers are allowed.
* @param checked Whether the answer is selected.
*/
  private updateSelectedAnswers(
    questionId: number,
    answerId: number,
    allowMultiple: boolean,
    checked: boolean): void {

    this.selectedAnswers.update((selected) =>
      this.createSelectedAnswers(selected, questionId,
        this.getSelectedAnswerIds(selected[questionId], answerId, allowMultiple, checked)));
  }

/**
* Creates the updated selection record.
* @param selected Current selected answers.
* @param questionId ID of the selected question.
* @param answerIds Selected answer IDs.
* @returns Updated selection record.
*/
  private createSelectedAnswers(
    selected: Record<number, number[]>,
    questionId: number,
    answerIds: number[]): Record<number, number[]> {

    return Object.assign({}, selected, { [questionId]: answerIds });
  }

/**
* Returns the answer IDs after a selection change.
* @param current Currently selected answer IDs.
* @param answerId ID of the changed answer.
* @param allowMultiple Whether multiple answers are allowed.
* @param checked Whether the answer is selected.
* @returns Updated answer IDs.
*/
  private getSelectedAnswerIds(
    current: number[] = [],
    answerId: number,
    allowMultiple: boolean,
    checked: boolean): number[] {

    if (!allowMultiple) return [answerId];

    if (checked && !current.includes(answerId)) {
      return [...current, answerId];
    }

    return current.filter((id) => id !== answerId);
  }

/**
* Checks whether every question has an answer.
* @returns Whether the survey is complete.
*/
  isSurveyComplete(): boolean {
    const questions = this.survey()?.questions ?? [];

    return questions.length > 0 &&
      questions.every((question) =>
        (this.selectedAnswers()[question.id]?.length ?? 0) > 0
      );
  }

/**
* Checks whether the survey has already ended.
* @returns Whether the survey has expired.
*/
  isSurveyExpired(): boolean {
    const endDate = this.survey()?.end_date;

    if (!endDate) return false;

    return new Date(endDate).getTime() < Date.now();
  }

/**
* Starts the survey submission when it is valid.
* @param event Survey form submit event.
*/
  async submitSurvey(event: Event): Promise<void> {
    event.preventDefault();

    if (!this.canSubmitSurvey()) return;

    await this.processSurveySubmission();
  }

/** Saves the submission and returns to the home page. */
  private async processSurveySubmission(): Promise<void> {
    this.isSubmitting.set(true);
    const saved = await this.saveCurrentSurvey();
    this.isSubmitting.set(false);

    if (!saved) return;
    await this.finishSurveySubmission();
  }

/** Finishes the survey submission. */
private async finishSurveySubmission(): Promise<void> {
  this.rememberVote();
  this.isVoteSuccessOpen.set(true);

  setTimeout(() => {
    void this.router.navigateByUrl('/');
  }, 2000);
}

/**
* Saves the current survey answers.
* @returns Whether the survey was saved.
*/
  private async saveCurrentSurvey(): Promise<boolean> {
    const surveyId = this.survey()?.id;

    if (!surveyId) return false;

    return this.surveyDetailService.saveSurvey(
      surveyId,
      this.selectedAnswers()
    );
  }


/** Stores that this survey was completed in this browser. */
  private rememberVote(): void {
    const surveyId = this.survey()?.id;

    if (!surveyId) return;

    localStorage.setItem(
      `voted-survey-${surveyId}`,
      'true'
    );
  }

/**
* Checks whether the survey can be submitted.
* @returns Whether the survey can be submitted.
*/
  private canSubmitSurvey(): boolean {
    return (
      !this.isSurveyExpired() &&
      !this.hasAlreadyVoted() &&
      this.isSurveyComplete() &&
      !this.isSubmitting()
    );
  }

/**
* Returns the displayed survey end date.
* @param isDemo Whether the survey uses a demo deadline.
* @param endDate Stored survey end date.
* @returns Formatted end date.
*/
  getEndDate(
    isDemo: boolean,
    endDate: string | null): string {

    if (isDemo) {
      return this.getTomorrowDate();
    }

    return this.formatDate(endDate);
  }

/**
* Returns tomorrow's date for demo surveys.
* @returns Tomorrow's formatted date.
*/
  private getTomorrowDate(): string {
    const tomorrow = new Date();

    tomorrow.setDate(
      tomorrow.getDate() + NEXT_DAY_OFFSET
    );

    return tomorrow.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

/**
* Returns the display letter for an answer.
* @param index Index of the answer.
* @returns Display letter of the answer.
*/
  getAnswerLetter(index: number): string {
    return String.fromCharCode(
      FIRST_ANSWER_LETTER_CODE + index
    );
  }

/**
* Converts a database date into the displayed format.
* @param date Stored database date.
* @returns Formatted date.
*/
  private formatDate(date: string | null): string {
    if (!date) return '';

    const [year, month, day] = date
      .slice(0, 10)
      .split('-');

    return `${day}.${month}.${year}`;
  }

/**
* Checks whether this survey was already completed in this browser.
* @returns Whether the survey was already completed.
*/
  hasAlreadyVoted(): boolean {
    const surveyId = this.survey()?.id;

    if (!surveyId) return false;

    return localStorage.getItem(
      `voted-survey-${surveyId}`
    ) === 'true';
  }

/** Removes the detail page class when leaving. */
  ngOnDestroy(): void {
    this.renderer.removeClass(document.body, 'body--detail');
  }
}