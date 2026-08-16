import {  Component,  inject,  OnDestroy,  OnInit,  Renderer2,  signal,} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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

  survey = signal<any | null>(null);

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

  private formatDate(date: string | null): string {
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