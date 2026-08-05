import { Component, inject, OnInit, signal } from '@angular/core';
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
export class SurveyDetail implements OnInit {
  private readonly supabaseService = inject(Supabase);

  survey = signal<any | null>(null);

  async ngOnInit(): Promise<void> {
    const { data, error } = await this.supabaseService.supabase
      .from('surveys')
      .select(`
        *,
        questions (
          *,
          answers (*)
        )
      `)
      .eq('id', 999999)
      .single();

    if (error) {
      console.error('Could not load survey:', error);
      return;
    }

    this.survey.set(data);
  }

  getEndLabel(
    isDemo: boolean,
    endDate: string | null
  ): string {
    if (isDemo) {
      return 'Ends in 1 Day';
    }

    return endDate ?? 'N/A';
  }
}