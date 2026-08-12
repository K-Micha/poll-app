import { Component, inject } from '@angular/core';
import {  Dropdown,  type SurveyCategory,} from '../dropdown/dropdown';
import { Supabase } from '../../../supabase';
import { RouterLink } from '@angular/router';

type Survey = ReturnType<Supabase['surveys']>[number];

type SurveyCardItem = Survey & {
  daysLeft: number | null;
};

type SurveyStatus = 'active' | 'past';

@Component({
    selector: 'app-survey-card',
    imports: [Dropdown, RouterLink],
    templateUrl: './survey-card.html',
    styleUrl: './survey-card.scss',
})

export class SurveyCard {
  
  selectedStatus: SurveyStatus = 'active';
  selectedCategory: SurveyCategory = 'All Surveys';

  private readonly supabase = inject(Supabase);

  selectStatus(status: SurveyStatus): void {
    this.selectedStatus = status;
  }

  selectCategory(category: SurveyCategory): void {
    this.selectedCategory = category;
  }

  get surveys(): SurveyCardItem[] {
    return this.supabase.surveys().map((survey) => ({
      ...survey,
      daysLeft: survey.is_demo
        ? this.getDemoDays(survey.id)
        : this.getDaysLeft(survey.end_date),
    }));
  }

  get endingSoonSurveys(): SurveyCardItem[] {
    return this.surveys
      .filter((survey) => this.isEndingSoon(survey))
      .sort((a, b) => a.daysLeft! - b.daysLeft!)
      .slice(0, 3);
  }

  get filteredSurveys(): SurveyCardItem[] {
    return this.surveys.filter((survey) =>
      this.matchesSelectedStatus(survey) &&
      this.matchesSelectedCategory(survey)
    );
  }

  private matchesSelectedStatus(
    survey: SurveyCardItem
  ): boolean {
    if (this.selectedStatus === 'past') {
      return survey.daysLeft === 0;
    }

    return survey.daysLeft === null || survey.daysLeft > 0;
  }

  private matchesSelectedCategory(
    survey: SurveyCardItem
  ): boolean {
    return (
      this.selectedCategory === 'All Surveys' ||
      survey.category === this.selectedCategory
    );
  }

  private isEndingSoon(survey: SurveyCardItem): boolean {
    return (
      survey.status === 'published' &&
      survey.daysLeft !== null &&
      survey.daysLeft >= 0 &&
      survey.daysLeft <= 3
    );
  }

  private getDemoDays(surveyId: number): number | null {
    const demoDays: Record<number, number> = {
      999999: 1,
      999998: 2,
      999997: 3,
    };

    return demoDays[surveyId] ?? null;
  }

  private getDaysLeft(endDate: string | null): number | null {
    if (!endDate) {
      return null;
    }

    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const difference = new Date(endDate).getTime() - Date.now();
    const daysLeft = Math.ceil(difference / millisecondsPerDay);

    return Math.max(0, daysLeft);
  }
}