import { Component, inject, OnDestroy, OnInit, Renderer2, signal, } from '@angular/core';
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

  private getDemoDays(surveyId: number): number | null {
    const demoDays: Record<number, number> = {
      999999: 1,
      999998: 2,
      999997: 3,
    };

    return demoDays[surveyId] ?? null;
  }

getEndLabel( surveyId: number, isDemo: boolean, endDate: string | null): string {
  if (!isDemo) {
    return endDate ?? 'N/A';
  }
  return this.getDemoEndLabel(surveyId);
}

private getDemoEndLabel(surveyId: number): string {
  const days = this.getDemoDays(surveyId);

  if (days === null) {
    return 'N/A';
  }
  return `Ends in ${days} ${this.getDayLabel(days)}`;
}

private getDayLabel(days: number): string {
  return days === 1 ? 'Day' : 'Days';
}

  ngOnDestroy(): void {
    this.renderer.removeClass(
      document.body,
      'body--detail'
    );
  }
}