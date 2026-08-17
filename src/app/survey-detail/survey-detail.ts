import {  Component,  inject,  OnDestroy,  OnInit,  Renderer2,  signal,} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Supabase } from '../supabase';
import { SurveyResults } from '../shared/components/survey-results/survey-results';
import { Header } from '../shared/layout/header/header';

@Component({
  selector: 'app-survey-detail',
  imports: [SurveyResults, Header],
  templateUrl: './survey-detail.html',
  styleUrl: './survey-detail.scss',
})
export class SurveyDetail implements OnInit, OnDestroy {
  private readonly supabaseService = inject(Supabase);
  private readonly renderer = inject(Renderer2);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  survey = signal<any | null>(null);
  selectedAnswers = signal<Record<number, number[]>>({});
  isSubmitting = signal(false);

  async ngOnInit(): Promise<void> {
    this.renderer.addClass(document.body, 'body--detail');
    await this.loadSurvey();
  }

  private async loadSurvey(): Promise<void> {
    const response = await this.getSurvey();

    if (response.error) {
      console.error('Could not load survey:', response.error);
      return;
    }

    this.survey.set(response.data);
  }

  private getSurvey() {
    const surveyId = Number(
      this.route.snapshot.paramMap.get('id')
    );

    return this.supabaseService.supabase
      .from('surveys')
      .select(`
        *,
        questions (*, answers (*))
      `)
      .eq('id', surveyId)
      .single();
  }

  selectAnswer(
    questionId: number,
    answerId: number,
    allowMultiple: boolean,
    event: Event
  ): void {
    const input = event.target as HTMLInputElement;

    this.updateSelectedAnswers(
      questionId,
      answerId,
      allowMultiple,
      input.checked
    );
  }

  private updateSelectedAnswers(
    questionId: number,
    answerId: number,
    allowMultiple: boolean,
    checked: boolean
  ): void {
    this.selectedAnswers.update((selected) => ({
      ...selected,
      [questionId]: this.getSelectedAnswerIds(
        selected[questionId],
        answerId,
        allowMultiple,
        checked
      ),
    }));
  }

  private getSelectedAnswerIds(
    current: number[] = [],
    answerId: number,
    allowMultiple: boolean,
    checked: boolean
  ): number[] {
    if (!allowMultiple) return [answerId];

    if (checked && !current.includes(answerId)) {
      return [...current, answerId];
    }

    return current.filter((id) => id !== answerId);
  }

  isSurveyComplete(): boolean {
    const questions = this.survey()?.questions ?? [];

    return questions.length > 0 &&
      questions.every((question: any) =>
        (
          this.selectedAnswers()[question.id]?.length ??
          0
        ) > 0
      );
  }

  async submitSurvey(event: Event): Promise<void> {
    event.preventDefault();

    if (!this.canSubmitSurvey()) return;

    this.isSubmitting.set(true);

    const submissionId = await this.createSubmission();
    const saved = await this.saveSurvey(submissionId);

    this.isSubmitting.set(false);

    if (saved) {
      await this.router.navigateByUrl('/');
    }
  }

  private canSubmitSurvey(): boolean {
    return (
      this.isSurveyComplete() &&
      !this.isSubmitting()
    );
  }

  private async saveSurvey(
    submissionId: number | null
  ): Promise<boolean> {
    if (submissionId === null) return false;

    return this.saveSubmissionAnswers(submissionId);
  }

  private async createSubmission(): Promise<number | null> {
    const surveyId = this.survey()?.id;
    if (!surveyId) return null;

    const { data, error } =
      await this.supabaseService.supabase
        .from('submissions')
        .insert({ survey_id: surveyId })
        .select('id')
        .single();

    if (!error) return data.id;

    console.error('Could not create submission:', error);
    return null;
  }

  private async saveSubmissionAnswers(
    submissionId: number
  ): Promise<boolean> {
    const answers =
      this.getSubmissionAnswers(submissionId);

    const { error } =
      await this.supabaseService.supabase
        .from('submission_answers')
        .insert(answers);

    if (!error) return true;

    console.error('Could not save answers:', error);
    return false;
  }

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

  getEndDate(
    isDemo: boolean,
    endDate: string | null
  ): string {
    if (isDemo) {
      return this.getTomorrowDate();
    }

    return this.formatDate(endDate);
  }

  private getTomorrowDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    return tomorrow.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  getAnswerLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  private formatDate(
    date: string | null
  ): string {
    if (!date) return '';

    const [year, month, day] = date
      .slice(0, 10)
      .split('-');

    return `${day}.${month}.${year}`;
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(
      document.body,
      'body--detail'
    );
  }
}