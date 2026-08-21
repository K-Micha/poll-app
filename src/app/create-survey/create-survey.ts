import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Dropdown, type SurveyCategory } from '../shared/components/dropdown/dropdown';
import {  CreateSurveyService,  type Answer,  type Question,  type SurveyDraft} from './create-survey.service';

@Component({
  selector: 'app-create-survey',
  imports: [Dropdown],
  templateUrl: './create-survey.html',
  styleUrl: './create-survey.scss',
})

export class CreateSurvey implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly createSurveyService =
    inject(CreateSurveyService);

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

  ngOnInit(): void {
    this.loadDraft();
  }

  ngOnDestroy(): void {
    this.createSurveyService.clearDraft();
  }

  clearSurveyName(): void {
    this.surveyName = '';
    this.saveDraft();
  }

  clearEndDate(): void {
    this.surveyEndDate = '';
    this.saveDraft();
  }

  clearDescription(): void {
    this.surveyDescription = '';
    this.saveDraft();
  }

  deleteQuestion(questionIndex: number): void {
    if (questionIndex === 0) {
      this.resetFirstQuestion();
      return;
    }

    this.questions.splice(questionIndex, 1);
    this.saveDraft();
  }

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

  deleteAnswer(questionIndex: number, answerIndex: number): void {
    const answers = this.questions[questionIndex].answers;

    this.clearOrRemoveAnswer(answers, answerIndex);
    this.saveDraft();
  }

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

  updateCategory(category: SurveyCategory): void {
    this.selectedCategory = category;
    this.saveDraft();
  }

  cancelSurvey(): void {
    this.createSurveyService.clearDraft();
    void this.router.navigateByUrl('/');
  }

  highlightCloseButton(): void {
    this.isCloseHighlighted.set(true);
  }

  resetCloseHighlight(): void {
    this.isCloseHighlighted.set(false);
  }

  publishSurvey(): void {
    if (!this.isSurveyValid()) {
      this.highlightInvalidFields();
      return;
    }

    this.isPublishOverlayOpen.set(true);
  }

  closePublishOverlay(): void {
    this.createSurveyService.clearDraft();
    this.isPublishOverlayOpen.set(false);
    this.isCloseHighlighted.set(false);

    void this.router.navigateByUrl('/');
  }

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

  addAnswer(questionIndex: number): void {
    this.questions[questionIndex].answers.push({
      text: ''
    });

    this.saveDraft();
  }

  updateSurveyName(event: Event): void {
    this.surveyName = this.getFieldValue(event);
    this.saveDraft();
  }

  updateDescription(event: Event): void {
    this.surveyDescription = this.getFieldValue(event);
    this.saveDraft();
  }

  updateQuestion(
    questionIndex: number,
    event: Event
  ): void {
    this.questions[questionIndex].text =
      this.getFieldValue(event);

    this.saveDraft();
  }

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

  updateMultipleAnswers(
    questionIndex: number,
    event: Event
  ): void {
    const input = event.target as HTMLInputElement;

    this.questions[questionIndex].multipleAnswers =
      input.checked;

    this.saveDraft();
  }

  getAnswerLetter(answerIndex: number): string {
    return String.fromCharCode(65 + answerIndex);
  }

  formatEndDate(event: Event): void {
    const input = event.target as HTMLInputElement;

    input.value =
      this.createSurveyService.formatEndDate(
        input.value
      );

    this.surveyEndDate = input.value;
    this.saveDraft();
  }

  completeEndDate(event: Event): void {
    event.preventDefault();

    const input = event.target as HTMLInputElement;

    input.value =
      this.createSurveyService.completeEndDate(
        input.value
      );

    this.validateEndDate(event);
  }

  validateEndDate(event: Event): void {
    const input = event.target as HTMLInputElement;

    input.value =
      this.createSurveyService.validateEndDate(
        input.value
      );

    this.surveyEndDate = input.value;
    this.saveDraft();
  }

  isSurveyValid(): boolean {
    return (
      this.surveyName.trim().length > 0 &&
      this.questions.every((question) =>
        this.isQuestionValid(question)
      )
    );
  }

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

  private highlightInvalidFields(): void {
    this.showValidationErrors.set(true);

    setTimeout(() => {
      this.showValidationErrors.set(false);
    }, 700);
  }

  private getFieldValue(event: Event): string {
    const field =
      event.target as
      | HTMLInputElement
      | HTMLTextAreaElement;

    return field.value;
  }

  private saveDraft(): void {
    const draft: SurveyDraft = {
      surveyName: this.surveyName,
      surveyEndDate: this.surveyEndDate,
      surveyDescription: this.surveyDescription,
      questions: this.questions
    };

    this.createSurveyService.saveDraft(draft);
  }

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