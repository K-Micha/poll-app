import { Component, inject,  OnDestroy,  OnInit,  Renderer2,  signal,} from '@angular/core';
import { Supabase } from '../supabase';
import { SurveyResults } from '../shared/components/survey-results/survey-results';
import { Header } from '../shared/layout/header/header';

@Component({
  selector: 'app-survey-detail',
  imports: [
    SurveyResults,
    Header,
  ],
  templateUrl: './survey-detail.html',
  styleUrl: './survey-detail.scss',
})
export class SurveyDetail implements OnInit, OnDestroy {
  private readonly supabaseService = inject(Supabase);
  private readonly renderer = inject(Renderer2);

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
    return this.supabaseService.supabase
      .from('surveys')
      .select(`
      *,
      questions (*, answers (*))
    `)
      .eq('id', 999999)
      .single();
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(document.body, 'body--detail');
  }

  getEndLabel(isDemo: boolean, endDate: string | null): string {
    if (isDemo) {
      return 'Ends in 1 Day';
    }

    return endDate ?? 'N/A';
  }
}