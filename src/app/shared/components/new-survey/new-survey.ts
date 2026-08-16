import { Component, inject, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-new-survey',
  imports: [],
  templateUrl: './new-survey.html',
  styleUrl: './new-survey.scss',
})
export class NewSurvey {
  @Input() variant: 'home' | 'header-create' = 'home';

  private readonly router = inject(Router);

  isSuccess = false;
  isAnimating = false;

  handleClick(): void {
    if (this.isAnimating) {
      return;
    }

    this.isAnimating = true;
    this.isSuccess = true;

    setTimeout(() => {
      void this.router.navigate([this.targetRoute]);
    }, 600);
  }

  private get targetRoute(): string {
    return this.variant === 'home'
      ? '/create-survey'
      : '/';
  }
}