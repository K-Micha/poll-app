import { Component, ElementRef, HostListener, Input, inject, output } from '@angular/core';

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
  @Input() variant: 'default' | 'create' = 'default';
  @Input() showSelectionBelow = false;
  @Input() label = '';

  @Input() set invalid(value: boolean) {
    this._invalid = value;
    if (value && !this.hasSelection) {
      this.showError = true;
    }
  }

  private _invalid = false;
  readonly surveyCategories = surveyCategories;
  readonly categoryChange = output<SurveyCategory>();
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  selectedCategory: SurveyCategory = 'All Surveys';
  hasSelection = false;
  isOpen = false;
  showError = false;

  /** Closes the dropdown when clicking outside. */
  @HostListener('document:click', ['$event'])
  closeOnOutsideClick(event: Event): void {
    const target = event.target as Node;

    if (!this.elementRef.nativeElement.contains(target)) {
      this.isOpen = false;
    }
  }

  /** Returns whether the dropdown is currently invalid. */
  get invalid(): boolean {
    return this._invalid;
  }

  /** Selects a category and sends it to the parent component. */
  selectCategory(category: SurveyCategory): void {
    this.selectedCategory = category;
    this.hasSelection = true;
    this.showError = false;
    this.categoryChange.emit(category);
    this.isOpen = false;
  }

  /** Opens or closes the category menu. */
  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }
}