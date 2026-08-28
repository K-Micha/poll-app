import { Component, inject, OnDestroy, OnInit, Renderer2, signal, } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Supabase } from '../supabase';
import { SurveyResults } from '../shared/components/survey-results/survey-results';
import { Header } from '../shared/layout/header/header';

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

  
  showResults = false;
  survey = signal<any | null>(null);
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

  /** Creates the database query for the current survey. */
  private getSurvey() {
    const surveyId = Number(
      this.route.snapshot.paramMap.get('id')
    );

    return this.supabaseService.supabase
      .from('surveys')
      .select('*, questions (*, answers (*))')
      .eq('id', surveyId)
      .single();
  }

  /** Handles the selection of a survey answer. */
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

  /** Updates the selected answers of a question. */
  private updateSelectedAnswers(
    questionId: number,
    answerId: number,
    allowMultiple: boolean,
    checked: boolean): void {

    this.selectedAnswers.update((selected) =>
      this.createSelectedAnswers(selected, questionId,
        this.getSelectedAnswerIds(selected[questionId], answerId, allowMultiple, checked)));
  }

  /** Creates the updated selection record. */
  private createSelectedAnswers(
    selected: Record<number, number[]>,
    questionId: number,
    answerIds: number[]): Record<number, number[]> {
    return Object.assign({}, selected, { [questionId]: answerIds });
  }

  /** Returns the answer IDs after a selection change. */
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

  /** Checks whether every question has an answer. */
  isSurveyComplete(): boolean {
    const questions = this.survey()?.questions ?? [];

    return questions.length > 0 &&
      questions.every((question: any) => (this.selectedAnswers()[question.id]?.length ?? 0) > 0);
  }

  /** Checks whether the survey has already ended. */
  isSurveyExpired(): boolean {
    const endDate = this.survey()?.end_date;

    if (!endDate) return false;

    return new Date(endDate).getTime() < Date.now();
  }

  /** Starts the survey submission when it is valid. */
  async submitSurvey(event: Event): Promise<void> {
    event.preventDefault();

    if (!this.canSubmitSurvey()) return;

    await this.processSurveySubmission();
  }

  /** Saves the submission and returns to the home page. */
  private async processSurveySubmission(): Promise<void> {
    this.isSubmitting.set(true);
    const submissionId = await this.createSubmission();
    const saved = await this.saveSurvey(submissionId);

    this.isSubmitting.set(false);

    if (saved) {
      this.rememberVote();
      await this.router.navigateByUrl('/');
    }
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

  /** Checks whether the survey can be submitted. */
  private canSubmitSurvey(): boolean {
    return (
      !this.isSurveyExpired() &&
      !this.hasAlreadyVoted() &&
      this.isSurveyComplete() &&
      !this.isSubmitting()
    );
  }

  /** Saves answers when a submission was created. */
  private async saveSurvey(submissionId: number | null): Promise<boolean> {
    if (submissionId === null) return false;

    return this.saveSubmissionAnswers(submissionId);
  }

  /** Creates a new survey submission. */
  private async createSubmission(): Promise<number | null> {
    const surveyId = this.survey()?.id;

    if (!surveyId) return null;

    const { data, error } = await this.insertSubmission(surveyId);

    if (!error) return data.id;

    console.error('Could not create submission:', error);
    return null;
  }

  /** Creates the database request for a submission. */
  private insertSubmission(surveyId: number) {
    return this.supabaseService.supabase
      .from('submissions')
      .insert({ survey_id: surveyId })
      .select('id')
      .single();
  }

  /** Stores all selected submission answers. */
  private async saveSubmissionAnswers(
    submissionId: number
  ): Promise<boolean> {
    const { error } = await this.insertSubmissionAnswers(submissionId);

    if (!error) return true;

    console.error('Could not save answers:', error);
    return false;
  }

  /** Creates the database request for the selected answers. */
  private insertSubmissionAnswers(
    submissionId: number
  ) {
    const answers =
      this.getSubmissionAnswers(submissionId);

    return this.supabaseService.supabase
      .from('submission_answers')
      .insert(answers);
  }

  /** Creates database rows for the selected answers. */
  private getSubmissionAnswers(
    submissionId: number
  ) {
    return Object.entries(this.selectedAnswers())
      .flatMap(([questionId, answerIds]) =>
        answerIds.map((answerId) => ({
          submission_id: submissionId,
          question_id: Number(questionId),
          answer_id: answerId,
        }))
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

  /** Returns tomorrow's date for demo surveys. */
  private getTomorrowDate(): string {
    const tomorrow = new Date();

    tomorrow.setDate(tomorrow.getDate() + 1);

    return tomorrow.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  /** Returns the display letter for an answer. */
  getAnswerLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  /** Converts a database date into the displayed format. */
  private formatDate(date: string | null): string {
    if (!date) return '';

    const [year, month, day] = date
      .slice(0, 10)
      .split('-');

    return `${day}.${month}.${year}`;
  }

  /** Checks whether this survey was already completed in this browser. */
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