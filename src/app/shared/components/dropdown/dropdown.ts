import { Component, Input, output } from '@angular/core';

export const surveyCategories = [
  'All Surveys',
  'Team Activities',
  'Health & Wellness',
  'Gaming & Entertainment',
  'Education & Learning',
  'Lifestyle & Preferences',
  'Technology & Innovation',
] as const;

export type SurveyCategory = (typeof surveyCategories)[number];

@Component({
  selector: 'app-dropdown',
  templateUrl: './dropdown.html',
  styleUrls: [
    './dropdown.scss',
    './dropdown-media.scss'
  ],
})

/** Controls category selection and dropdown visibility. */
export class Dropdown {
  @Input() invalid = false;
  @Input() label = '';

  readonly surveyCategories = surveyCategories;
  readonly categoryChange = output<SurveyCategory>();

  selectedCategory: SurveyCategory = 'All Surveys';
  hasSelection = false;
  isOpen = false;

  /** Selects a category and sends it to the parent component. */
  selectCategory(category: SurveyCategory): void {
    this.selectedCategory = category;
    this.hasSelection = true;
    this.categoryChange.emit(category);
    this.isOpen = false;
  }

  /** Opens or closes the category menu. */
  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }
}