import { Component, inject, Input, output } from '@angular/core';
import { Router } from '@angular/router';

const SUCCESS_ANIMATION_DELAY = 600;

@Component({
  selector: 'app-new-survey',
  imports: [],
  templateUrl: './new-survey.html',
  styleUrls: [
    './new-survey.scss',
    './new-survey-media.scss'
  ],
})

/** Controls the animated button for creating a survey. */
export class NewSurvey {
  @Input() variant: 'home' | 'header-create' = 'home';
  @Input() route = '/create-survey';

  private readonly router = inject(Router);

  createSurvey = output<void>();
  isSuccess = false;
  isAnimating = false;

/** Plays the success animation before opening the create page. */
  handleClick(): void {
    if (this.isAnimating) return;

    this.isAnimating = true;
    this.isSuccess = true;

    setTimeout(() => {
      void this.router.navigateByUrl(this.route);
    }, SUCCESS_ANIMATION_DELAY);
  }
}