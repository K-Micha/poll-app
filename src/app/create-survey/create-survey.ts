import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Dropdown, type SurveyCategory } from '../shared/components/dropdown/dropdown';
import { CreateSurveyService, type Question, type SurveyDraft } from './create-survey.service';
import { Header } from '../shared/layout/header/header';
import { clearOrRemoveAnswer, createEmptyQuestion, getAnswerLetter, getFieldValue } from './create-survey.utils';

const FIRST_QUESTION_INDEX = 0;
const REMOVE_ITEM_COUNT = 1;
const PUBLISH_REDIRECT_DELAY = 2000;
const ERROR_HIGHLIGHT_DELAY = 1000;

@Component({
  selector: 'app-create-survey',
  imports: [Dropdown, Header],
  templateUrl: './create-survey.html',
  styleUrls: [
    './create-survey.scss',
    './create-survey-media.scss',
  ],
})

/** Controls the create survey form and its interactions. */
export class CreateSurvey implements OnInit, OnDestroy {
  private publishedSurveyId: number | null = null;
  private readonly router = inject(Router);
  private readonly createSurveyService = inject(CreateSurveyService);

  showFieldErrors = signal(false);
  readonly isPublishOverlayOpen = signal(false);
  readonly isCloseHighlighted = signal(false);
  readonly showValidationErrors = signal(false);
  readonly isEndDateInvalid = signal(false);

  selectedCategory: SurveyCategory | null = null;
  surveyName = '';
  surveyEndDate = '';
  surveyDescription = '';

  questions: Question[] = [
    createEmptyQuestion()
  ];

/** Restores the saved survey draft. */
  ngOnInit(): void {
    this.loadDraft();
  }

/** Removes the draft when leaving the component. */
  ngOnDestroy(): void {
    this.createSurveyService.clearDraft();
  }

/** Clears the survey name. */
  clearSurveyName(): void {
    this.surveyName = '';
    this.saveDraft();
  }

/** Clears the optional end date. */
  clearEndDate(): void {
    this.surveyEndDate = '';
    this.saveDraft();
  }

/** Clears the optional description. */
  clearDescription(): void {
    this.surveyDescription = '';
    this.saveDraft();
  }

/**
* Deletes or resets a question.
* @param questionIndex Position of the question.
* @returns Nothing.
*/
  deleteQuestion(questionIndex: number): void {
    if (questionIndex === FIRST_QUESTION_INDEX) {
      this.resetFirstQuestion();
      return;
    }

    this.questions.splice(questionIndex, REMOVE_ITEM_COUNT);

    this.saveDraft();
  }

/** Restores the first question. */
  private resetFirstQuestion(): void {
    this.questions[FIRST_QUESTION_INDEX] = createEmptyQuestion();

    this.saveDraft();
  }

/**
* Deletes or clears an answer.
* @param questionIndex Position of the question.
* @param answerIndex Position of the answer.
*/
  deleteAnswer(
    questionIndex: number,
    answerIndex: number): void {
    clearOrRemoveAnswer(this.questions[questionIndex].answers, answerIndex);

    this.saveDraft();
  }

/**
* Stores the selected category.
* @param category Selected survey category.
*/
  updateCategory(category: SurveyCategory): void {
    this.selectedCategory = category;
    this.saveDraft();
  }

/** Discards the survey and returns home. */
  cancelSurvey(): void {
    this.createSurveyService.clearDraft();
    void this.router.navigateByUrl('/');
  }

/** Highlights the overlay close button. */
  highlightCloseButton(): void {
    this.isCloseHighlighted.set(true);
  }

/** Removes the close button highlight. */
  resetCloseHighlight(): void {
    this.isCloseHighlighted.set(false);
  }

/** Validates and publishes the survey. */
  async publishSurvey(): Promise<void> {
    if (!this.isSurveyValid()) {
      this.showFieldErrors.set(true);
      this.highlightInvalidFields();
      return;
    }

    await this.savePublishedSurvey();
  }

/**
* Checks whether the survey is valid.
* @returns Whether the survey is valid.
*/
  isSurveyValid(): boolean {
    return this.createSurveyService.isSurveyValid(
      this.getDraft(),
      this.selectedCategory
    );
  }

/** Publishes a valid survey. */
  private async savePublishedSurvey(): Promise<void> {
    if (!this.selectedCategory) return;

    await this.publishSurveyData(
      this.selectedCategory
    );

    this.redirectAfterPublish();
  }

/** Redirects home after publishing. */
  private redirectAfterPublish(): void {
    setTimeout(() => { void this.router.navigateByUrl('/'); }, PUBLISH_REDIRECT_DELAY);
  }

/**
* Publishes the survey data.
* @param category Selected survey category.
*/
  private async publishSurveyData(
    category: SurveyCategory): Promise<void> {
    try {
      await this.storePublishedSurvey(category);
    } catch (error) {
      this.handlePublishError(error);
    }
  }

/**
* Stores the survey.
* @param category Selected survey category.
*/
  private async storePublishedSurvey(
    category: SurveyCategory): Promise<void> {
    this.publishedSurveyId = await this.createSurveyService.publishSurvey(
      this.getDraft(),
      category
    );

    this.isPublishOverlayOpen.set(true);
  }

/**
* Reports a publishing error.
* @param error Publishing error.
*/
  private handlePublishError(error: unknown): void {
    console.error('Could not publish survey:',
      error
    );
  }

  /** Opens the created survey. */
  closePublishOverlay(): void {
    if (this.publishedSurveyId === null) return;

    const surveyId = this.publishedSurveyId;

    this.createSurveyService.clearDraft();
    this.isPublishOverlayOpen.set(false);

    void this.router.navigate(['/survey-detail', surveyId]);
  }

/** Adds a new question. */
  addQuestion(): void {
    this.questions.push(createEmptyQuestion());

    this.saveDraft();
  }

/**
* Adds an answer.
* @param questionIndex Position of the question.
*/
  addAnswer(questionIndex: number): void {
    this.questions[questionIndex]
      .answers.push({ text: '' });

    this.saveDraft();
  }

/**
* Updates the survey name.
* @param event Form field event.
*/
  updateSurveyName(event: Event): void {
    this.surveyName = getFieldValue(event);
    this.saveDraft();
  }

/**
* Updates the survey description.
* @param event Form field event.
*/
  updateDescription(event: Event): void {
    this.surveyDescription = getFieldValue(event);

    this.saveDraft();
  }

/**
* Updates a question.
* @param questionIndex Position of the question.
* @param event Form field event.
*/
  updateQuestion(
    questionIndex: number,
    event: Event): void {

    this.questions[questionIndex].text = getFieldValue(event);

    this.saveDraft();
  }

/**
* Updates an answer.
* @param questionIndex Position of the question.
* @param answerIndex Position of the answer.
* @param event Form field event.
*/
  updateAnswer(
    questionIndex: number,
    answerIndex: number,
    event: Event): void {

    this.questions[questionIndex]
      .answers[answerIndex].text = getFieldValue(event);

    this.saveDraft();
  }

/**
* Updates the multiple-answer option.
* @param questionIndex Position of the question.
* @param event Checkbox change event.
*/
  updateMultipleAnswers(
    questionIndex: number,
    event: Event): void {
    const input = event.target as HTMLInputElement;

    this.questions[questionIndex]
      .multipleAnswers = input.checked;

    this.saveDraft();
  }

/**
* Returns an answer letter.
* @param answerIndex Position of the answer.
* @returns Uppercase answer letter.
*/
  getAnswerLetter(answerIndex: number): string {
    return getAnswerLetter(answerIndex);
  }

/** Saves the current survey draft. */
  private saveDraft(): void {
    this.createSurveyService.saveDraft(
      this.getDraft()
    );
  }

/**
* Returns the current survey draft.
* @returns Current survey draft.
*/
  private getDraft(): SurveyDraft {
    return {
      surveyName: this.surveyName,
      surveyEndDate: this.surveyEndDate,
      surveyDescription: this.surveyDescription,
      questions: this.questions,
    };
  }

/** Highlights invalid required fields. */
  private highlightInvalidFields(): void {
    this.showValidationErrors.set(true);

    setTimeout(() => {
      this.showValidationErrors.set(false);
    }, ERROR_HIGHLIGHT_DELAY);
  }

/** Restores the saved survey draft. */
  private loadDraft(): void {
    const draft =
      this.createSurveyService.loadDraft();

    if (!draft) return;

    this.surveyName = draft.surveyName;
    this.surveyEndDate = draft.surveyEndDate;
    this.surveyDescription = draft.surveyDescription;
    this.questions = draft.questions;
  }

/**
* Returns today's date.
* @returns Today's date for the picker.
*/
  getTodayDate(): string {
    return this.createSurveyService.getTodayDate();
  }

/**
* Updates the survey end date.
* @param event Date picker change event.
*/
  updateEndDate(event: Event): void {
    const value = getFieldValue(event);

    this.surveyEndDate =
      this.createSurveyService.validatePickerDate(value);

    this.saveDraft();
  }
}