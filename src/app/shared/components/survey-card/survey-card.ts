import { Component, inject, Input } from '@angular/core';
import { Dropdown, type SurveyCategory } from '../dropdown/dropdown';
import { Supabase } from '../../../supabase';
import { RouterLink } from '@angular/router';

const ENDING_SOON_DAYS = 3;
const ENDING_SOON_LIMIT = 3;
const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;
const DRAG_HOLD_DELAY = 150;

type Survey = ReturnType<Supabase['surveys']>[number];

type SurveyCardItem = Survey & {daysLeft: number | null;};

type SurveyStatus = 'active' | 'past';

@Component({
  selector: 'app-survey-card',
  imports: [Dropdown, RouterLink],
  templateUrl: './survey-card.html',
  styleUrls: [
    './survey-card.scss',
    './survey-card-media.scss'
  ],
})

/** Controls survey filtering, sorting, and card data. */
export class SurveyCard {
  @Input() label = '';

  isDragging = false;
  private holdTimer?: ReturnType<typeof setTimeout>;
  private startX = 0;
  private scrollLeft = 0;

  selectedStatus: SurveyStatus = 'active';
  selectedCategory: SurveyCategory = 'All Surveys';

  private readonly supabase = inject(Supabase);

/**
* Changes the displayed survey status.
* @param status Selected survey status.
*/
  selectStatus(status: SurveyStatus): void { this.selectedStatus = status;
  }

/**
* Changes the selected category filter.
* @param category Selected survey category.
*/
  selectCategory(category: SurveyCategory): void { this.selectedCategory = category;
  }

/**
* Adds the remaining days to each survey.
* @returns Surveys with remaining days.
*/
  get surveys(): SurveyCardItem[] {
    return this.supabase.surveys().map((survey) => ({
      ...survey,
      daysLeft: survey.is_demo
        ? this.getDemoDays(survey.id)
        : this.getDaysLeft(survey.end_date),
    }));
  }

/**
* Returns up to three surveys ending soon.
* @returns Surveys ending soon.
*/
  get endingSoonSurveys(): SurveyCardItem[] {
    return this.surveys
      .filter((survey) => this.isEndingSoon(survey))
      .sort((a, b) => a.daysLeft! - b.daysLeft!)
      .slice(0, ENDING_SOON_LIMIT);
  }

/**
* Returns filtered surveys sorted by their end date.
* @returns Filtered surveys.
*/
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

/**
* Checks whether a survey matches the selected status.
* @param survey Survey to check.
* @returns Whether the status matches.
*/
  private matchesSelectedStatus(
    survey: SurveyCardItem): boolean {
    if (this.selectedStatus === 'past') {
      return survey.daysLeft === 0;
    }

    return survey.daysLeft === null || survey.daysLeft > 0;
  }

/**
* Checks whether a survey matches the category filter.
* @param survey Survey to check.
* @returns Whether the category matches.
*/
  private matchesSelectedCategory(
    survey: SurveyCardItem): boolean {
    return (
      this.selectedCategory === 'All Surveys' ||
      survey.category === this.selectedCategory
    );
  }

/**
* Checks whether a survey ends within three days.
* @param survey Survey to check.
* @returns Whether the survey ends soon.
*/
  private isEndingSoon(
    survey: SurveyCardItem): boolean {
    return (
      survey.status === 'published' &&
      survey.daysLeft !== null &&
      survey.daysLeft >= 0 &&
      survey.daysLeft <= ENDING_SOON_DAYS
    );
  }

/**
* Returns fixed remaining days for demo surveys.
* @param surveyId ID of the demo survey.
* @returns Remaining demo days or null.
*/
  private getDemoDays(
    surveyId: number): number | null {
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
    endDate: string | null): number | null {
    if (!endDate) {
      return null;
    }

    const difference = new Date(endDate).getTime() - Date.now();
    const daysLeft = Math.ceil(difference / MILLISECONDS_PER_DAY);

    return Math.max(0, daysLeft);
  }

/**
* Starts mouse drag mode after a short hold delay.
* @param event Pointer event.
* @param list Scrollable survey list.
*/
  startDrag(
    event: PointerEvent,
    list: HTMLElement): void {
    if (event.pointerType === 'touch') return;

    this.startX = event.clientX;
    this.scrollLeft = list.scrollLeft;

    this.holdTimer = setTimeout(() => {
      this.isDragging = true;
      list.setPointerCapture(event.pointerId);}, DRAG_HOLD_DELAY);
  }

/**
* Moves the card list while dragging.
* @param event Pointer event.
* @param list Scrollable survey list.
*/
  drag(
    event: PointerEvent,
    list: HTMLElement): void {
    if (event.pointerType === 'touch' || !this.isDragging)
      return;

    const distance = event.clientX - this.startX;
    list.scrollLeft = this.scrollLeft - distance;
  }

/**
* Stops dragging and releases pointer capture.
* @param event Pointer event.
* @param list Scrollable survey list.
*/
  stopDrag(
    event: PointerEvent,
    list: HTMLElement): void {
    clearTimeout(this.holdTimer);

    if (event.pointerType === 'touch') return;

    if (list.hasPointerCapture(event.pointerId)) {
      list.releasePointerCapture(event.pointerId);
    }

    this.isDragging = false;
  }
}