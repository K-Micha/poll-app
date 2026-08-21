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
  styleUrl: './dropdown.scss',
})

export class Dropdown {
  @Input() label = '';

  readonly surveyCategories = surveyCategories;
  readonly categoryChange = output<SurveyCategory>();

  selectedCategory: SurveyCategory = 'All Surveys';
  hasSelection = false;
  isOpen = false;

  selectCategory(category: SurveyCategory): void {
    this.selectedCategory = category;
    this.hasSelection = true;
    this.categoryChange.emit(category);
    this.isOpen = false;
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }
}