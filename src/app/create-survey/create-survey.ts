import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { Dropdown } from '../shared/components/dropdown/dropdown';

interface Answer {
  text: string;
}

interface Question {
  text: string;
  answers: Answer[];
  multipleAnswers: boolean;
}

interface SurveyDraft {
  surveyName: string;
  surveyEndDate: string;
  surveyDescription: string;
  questions: Question[];
}

@Component({
  selector: 'app-create-survey',
  imports: [Dropdown],
  templateUrl: './create-survey.html',
  styleUrl: './create-survey.scss',
})
export class CreateSurvey implements OnInit, OnDestroy {
  private readonly draftKey = 'create-survey-draft';
  readonly isPublishOverlayOpen = signal(false);
  readonly isCloseHighlighted = signal(false);

  surveyName = '';
  surveyEndDate = '';
  surveyDescription = '';

  questions: Question[] = [
    {
      text: 'Which date would work best for you?',
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
    sessionStorage.removeItem(this.draftKey);
  }

  highlightCloseButton(): void {
    this.isCloseHighlighted.set(true);
  }

  resetCloseHighlight(): void {
    this.isCloseHighlighted.set(false);
  }

  publishSurvey(): void {
    this.isPublishOverlayOpen.set(true);
  }

  closePublishOverlay(): void {
    this.isPublishOverlayOpen.set(false);
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
    this.questions[questionIndex].answers.push({ text: '' });
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

  updateQuestion(questionIndex: number, event: Event): void {
    this.questions[questionIndex].text = this.getFieldValue(event);
    this.saveDraft();
  }

  updateAnswer(questionIndex: number, answerIndex: number, event: Event): void {
    this.questions[questionIndex].answers[answerIndex].text = this.getFieldValue(event);
    this.saveDraft();
  }

  updateMultipleAnswers(questionIndex: number, event: Event): void {
    const input = event.target as HTMLInputElement;

    this.questions[questionIndex].multipleAnswers = input.checked;
    this.saveDraft();
  }

  getAnswerLetter(answerIndex: number): string {
    return String.fromCharCode(65 + answerIndex);
  }

  formatEndDate(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 8);

    input.value = this.addDateDots(digits);
    this.surveyEndDate = input.value;
    this.saveDraft();
  }

  completeEndDate(event: Event): void {
    event.preventDefault();

    const input = event.target as HTMLInputElement;
    let digits = input.value.replace(/\D/g, '');

    if (digits.length === 6) {
      digits = `${digits.slice(0, 4)}20${digits.slice(4)}`;
    }

    input.value = this.addDateDots(digits);
    this.validateEndDate(event);
  }

  validateEndDate(event: Event): void {
    const input = event.target as HTMLInputElement;
    const date = this.parseEndDate(input.value);
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    if (input.value && (!date || date < today)) {
      input.value = '';
    }

    this.surveyEndDate = input.value;
    this.saveDraft();
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
    const [day, month, year] = value.split('.').map(Number);
    const date = new Date(year, month - 1, day);
    const isValid = year >= 1000
      && date.getDate() === day
      && date.getMonth() === month - 1
      && date.getFullYear() === year;

    return isValid ? date : null;
  }

  private getFieldValue(event: Event): string {
    const field = event.target as HTMLInputElement | HTMLTextAreaElement;

    return field.value;
  }

  private saveDraft(): void {
    const draft: SurveyDraft = {
      surveyName: this.surveyName,
      surveyEndDate: this.surveyEndDate,
      surveyDescription: this.surveyDescription,
      questions: this.questions
    };

    sessionStorage.setItem(this.draftKey, JSON.stringify(draft));
  }

  private loadDraft(): void {
    const savedDraft = sessionStorage.getItem(this.draftKey);

    if (!savedDraft) {
      return;
    }

    const draft = JSON.parse(savedDraft) as SurveyDraft;

    this.surveyName = draft.surveyName;
    this.surveyEndDate = draft.surveyEndDate;
    this.surveyDescription = draft.surveyDescription;
    this.questions = draft.questions;
  }
}