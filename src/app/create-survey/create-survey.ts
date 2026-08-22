import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Dropdown, type SurveyCategory } from '../shared/components/dropdown/dropdown';
import { CreateSurveyService, type Answer, type Question, type SurveyDraft } from './create-survey.service';

@Component({
  selector: 'app-create-survey',
  imports: [Dropdown],
  templateUrl: './create-survey.html',
  styleUrl: './create-survey.scss',
})

/** Controls the create survey form and its interactions. */
export class CreateSurvey implements OnInit, OnDestroy {
  private publishedSurveyId: number | null = null;
  private readonly router = inject(Router);
  private readonly createSurveyService = inject(CreateSurveyService);

  readonly isPublishOverlayOpen = signal(false);
  readonly isCloseHighlighted = signal(false);
  readonly showValidationErrors = signal(false);

  selectedCategory: SurveyCategory | null = null;
  surveyName = '';
  surveyEndDate = '';
  surveyDescription = '';

  questions: Question[] = [
    {
      text: '',
      multipleAnswers: false,
      answers: [
        { text: '' },
        { text: '' }
      ]
    }
  ];

  /** Restores the saved survey draft. */
  ngOnInit(): void {
    this.loadDraft();
  }

  /** Removes the draft when leaving the component. */
  ngOnDestroy(): void { this.createSurveyService.clearDraft(); }

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

  /** Resets the first question or removes an additional question. */
  deleteQuestion(questionIndex: number): void {
    if (questionIndex === 0) {
      this.resetFirstQuestion();
      return;
    }

    this.questions.splice(questionIndex, 1);
    this.saveDraft();
  }

  /** Restores the first question to its initial state. */
  private resetFirstQuestion(): void {
    this.questions[0] = {
      text: '',
      multipleAnswers: false,
      answers: [
        { text: '' },
        { text: '' }
      ]
    };

    this.saveDraft();
  }

  /** Clears a required answer or removes an additional answer. */
  deleteAnswer(questionIndex: number, answerIndex: number): void {
    const answers = this.questions[questionIndex].answers;

    this.clearOrRemoveAnswer(answers, answerIndex);
    this.saveDraft();
  }

  /**
   * Keeps the two required answers and removes additional ones.
   * @param answers Answers belonging to the selected question.
   * @param answerIndex Position of the selected answer.
   */
  private clearOrRemoveAnswer(
    answers: Answer[],
    answerIndex: number
  ): void {
    if (answerIndex < 2) {
      answers[answerIndex].text = '';
      return;
    }

    answers.splice(answerIndex, 1);
  }

  /** Stores the selected survey category. */
  updateCategory(category: SurveyCategory): void {
    this.selectedCategory = category;
    this.saveDraft();
  }

  /** Discards the draft and returns to the home page. */
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

  /** Validates and publishes the current survey. */
  async publishSurvey(): Promise<void> {
    if (!this.isSurveyValid()) {
      this.highlightInvalidFields();
      return;
    }

    await this.savePublishedSurvey();
  }

  /** Publishes the survey when a category is selected. */
  private async savePublishedSurvey(): Promise<void> {
    if (!this.selectedCategory) {
      return;
    }

    await this.publishSurveyData(
      this.selectedCategory
    );
  }

  /** Handles errors during the publishing process. */
  private async publishSurveyData(
    category: SurveyCategory
  ): Promise<void> {
    try {
      await this.storePublishedSurvey(category);
    } catch (error) {
      this.handlePublishError(error);
    }
  }

  /** Stores the survey and opens the confirmation overlay. */
  private async storePublishedSurvey(
    category: SurveyCategory
  ): Promise<void> {
    this.publishedSurveyId =
      await this.createSurveyService.publishSurvey(
        this.getDraft(),
        category
      );

    this.isPublishOverlayOpen.set(true);
  }

  /** Reports a failed publishing request. */
  private handlePublishError(error: unknown): void {
    console.error('Could not publish survey:', error);
  }

  /** Closes the overlay and opens the created survey. */
  closePublishOverlay(): void {
    if (this.publishedSurveyId === null) {
      return;
    }

    const surveyId = this.publishedSurveyId;

    this.createSurveyService.clearDraft();
    this.isPublishOverlayOpen.set(false);

    void this.router.navigate([
      '/survey-detail',
      surveyId
    ]);
  }

  /** Adds a new question with two empty answers. */
  addQuestion(): void {
    this.questions.push({
      text: '',
      multipleAnswers: false,
      answers: [
        { text: '' },
        { text: '' }
      ]
    });

    this.saveDraft();
  }

  /** Adds an empty answer to a question. */
  addAnswer(questionIndex: number): void {
    this.questions[questionIndex].answers.push({
      text: ''
    });

    this.saveDraft();
  }

  /** Updates the survey name. */
  updateSurveyName(event: Event): void {
    this.surveyName = this.getFieldValue(event);
    this.saveDraft();
  }

  /** Updates the optional survey description. */
  updateDescription(event: Event): void {
    this.surveyDescription = this.getFieldValue(event);
    this.saveDraft();
  }

  /** Updates the text of a question. */
  updateQuestion(
    questionIndex: number,
    event: Event
  ): void {
    this.questions[questionIndex].text =
      this.getFieldValue(event);

    this.saveDraft();
  }

  /** Updates the text of an answer. */
  updateAnswer(
    questionIndex: number,
    answerIndex: number,
    event: Event
  ): void {
    this.questions[questionIndex]
      .answers[answerIndex].text =
      this.getFieldValue(event);

    this.saveDraft();
  }

  /** Updates whether a question accepts multiple answers. */
  updateMultipleAnswers(
    questionIndex: number,
    event: Event
  ): void {
    const input = event.target as HTMLInputElement;

    this.questions[questionIndex].multipleAnswers =
      input.checked;

    this.saveDraft();
  }

  /** Converts an answer index into an uppercase letter. */
  getAnswerLetter(answerIndex: number): string {
    return String.fromCharCode(65 + answerIndex);
  }

  /** Formats the end date while the user is typing. */
  formatEndDate(event: Event): void {
    const input = event.target as HTMLInputElement;

    input.value =
      this.createSurveyService.formatEndDate(
        input.value
      );

    this.surveyEndDate = input.value;
    this.saveDraft();
  }

  /** Completes a short year when Enter is pressed. */
  completeEndDate(event: Event): void {
    event.preventDefault();

    const input = event.target as HTMLInputElement;

    input.value =
      this.createSurveyService.completeEndDate(
        input.value
      );

    this.validateEndDate(event);
  }

  /** Removes an invalid or past end date. */
  validateEndDate(event: Event): void {
    const input = event.target as HTMLInputElement;

    input.value =
      this.createSurveyService.validateEndDate(
        input.value
      );

    this.surveyEndDate = input.value;
    this.saveDraft();
  }

  /** Checks whether all required survey fields are valid. */
  isSurveyValid(): boolean {
    const hasName = this.surveyName.trim().length > 0;
    const hasCategory = this.selectedCategory !== null;

    return (
      hasName &&
      hasCategory &&
      this.areQuestionsValid()
    );
  }

  /** Checks whether every question is valid. */
  private areQuestionsValid(): boolean {
    return this.questions.every((question) =>
      this.isQuestionValid(question)
    );
  }

  /** Saves the current form state as a draft. */
  private saveDraft(): void {
    const draft: SurveyDraft = {
      surveyName: this.surveyName,
      surveyEndDate: this.surveyEndDate,
      surveyDescription: this.surveyDescription,
      questions: this.questions
    };

    this.createSurveyService.saveDraft(draft);
  }

  /** Returns the current form state. */
  private getDraft(): SurveyDraft {
    return {
      surveyName: this.surveyName,
      surveyEndDate: this.surveyEndDate,
      surveyDescription: this.surveyDescription,
      questions: this.questions,
    };
  }

  /** Checks the text and answers of one question. */
  private isQuestionValid(
    question: Question
  ): boolean {
    return (
      question.text.trim().length > 0 &&
      question.answers.length >= 2 &&
      question.answers.every((answer) =>
        answer.text.trim().length > 0
      )
    );
  }

  /** Briefly highlights invalid required fields. */
  private highlightInvalidFields(): void {
    this.showValidationErrors.set(true);

    setTimeout(() => {
      this.showValidationErrors.set(false);
    }, 1000);
  }

  /** Reads the current value from a form field event. */
  private getFieldValue(event: Event): string {
    const field =
      event.target as
      | HTMLInputElement
      | HTMLTextAreaElement;

    return field.value;
  }

  /** Restores the saved form state. */
  private loadDraft(): void {
    const draft =
      this.createSurveyService.loadDraft();

    if (!draft) return;

    this.surveyName = draft.surveyName;
    this.surveyEndDate = draft.surveyEndDate;
    this.surveyDescription =
      draft.surveyDescription;
    this.questions = draft.questions;
  }
}