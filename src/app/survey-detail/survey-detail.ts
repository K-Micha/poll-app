import { Component, inject, OnInit } from '@angular/core';
import { Supabase } from '../supabase';
import { SurveyResults } from '../shared/components/survey-results/survey-results';

@Component({
  selector: 'app-survey-detail',
  imports: [
    SurveyResults
  ],
  templateUrl: './survey-detail.html',
  styleUrl: './survey-detail.scss',
})
export class SurveyDetail implements OnInit {
  private readonly supabaseService = inject(Supabase);

  survey: any = null;

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
      console.error(error);
      return;
    }

    this.survey = data;
  }

  getEndDate(
    surveyId: number,
    endDate: string | null
  ): string | null {
    return surveyId === 999999
      ? this.getTomorrowDate()
      : endDate;
  }

  private getTomorrowDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    return tomorrow.toISOString().split('T')[0];
  }
}