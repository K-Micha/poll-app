import { Component, inject, Input } from '@angular/core';
import { Dropdown, type SurveyCategory } from '../dropdown/dropdown';
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
  styleUrls: [
    './survey-card.scss',
    './survey-card-media.scss'],
})

/** Controls survey filtering, sorting, and card data. */
export class SurveyCard {
  @Input() label = '';

  selectedStatus: SurveyStatus = 'active';
  selectedCategory: SurveyCategory = 'All Surveys';

  private readonly supabase = inject(Supabase);

  /** Changes the displayed survey status. */
  selectStatus(status: SurveyStatus): void {
    this.selectedStatus = status;
  }

  /** Changes the selected category filter. */
  selectCategory(category: SurveyCategory): void {
    this.selectedCategory = category;
  }

  /** Adds the remaining days to each survey. */
  get surveys(): SurveyCardItem[] {
    return this.supabase.surveys().map((survey) => ({
      ...survey,
      daysLeft: survey.is_demo
        ? this.getDemoDays(survey.id)
        : this.getDaysLeft(survey.end_date),
    }));
  }

  /** Returns up to three surveys ending soon. */
  get endingSoonSurveys(): SurveyCardItem[] {
    return this.surveys
      .filter((survey) => this.isEndingSoon(survey))
      .sort((a, b) => a.daysLeft! - b.daysLeft!)
      .slice(0, 3);
  }

  /** Returns filtered surveys sorted by their end date. */
  get filteredSurveys(): SurveyCardItem[] {
    return this.surveys
      .filter((survey) =>
        this.matchesSelectedStatus(survey) &&
        this.matchesSelectedCategory(survey)
      )
      .sort((a, b) =>
        (a.daysLeft ?? Number.POSITIVE_INFINITY) -
        (b.daysLeft ?? Number.POSITIVE_INFINITY)
      );
  }

  /** Checks whether a survey matches the selected status. */
  private matchesSelectedStatus(
    survey: SurveyCardItem
  ): boolean {
    if (this.selectedStatus === 'past') {
      return survey.daysLeft === 0;
    }

    return survey.daysLeft === null || survey.daysLeft > 0;
  }

  /** Checks whether a survey matches the category filter. */
  private matchesSelectedCategory(
    survey: SurveyCardItem
  ): boolean {
    return (
      this.selectedCategory === 'All Surveys' ||
      survey.category === this.selectedCategory
    );
  }

  /** Checks whether a survey ends within three days. */
  private isEndingSoon(survey: SurveyCardItem): boolean {
    return (
      survey.status === 'published' &&
      survey.daysLeft !== null &&
      survey.daysLeft >= 0 &&
      survey.daysLeft <= 3
    );
  }

  /** Returns fixed remaining days for demo surveys. */
  private getDemoDays(surveyId: number): number | null {
    const demoDays: Record<number, number> = {
      999999: 1,
      999998: 2,
      999997: 3,
    };

    return demoDays[surveyId] ?? null;
  }

  /**
   * Calculates the remaining days until a survey ends.
   * @param endDate Survey end date or null.
   * @returns Remaining days or null without an end date.
   */
  private getDaysLeft(
    endDate: string | null
  ): number | null {
    if (!endDate) {
      return null;
    }

    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const difference =
      new Date(endDate).getTime() - Date.now();

    const daysLeft = Math.ceil(difference / millisecondsPerDay);

    return Math.max(0, daysLeft);
  }
}