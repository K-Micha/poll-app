import {
  Component,
  inject,
  Input,
  output,
} from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-new-survey',
  imports: [],
  templateUrl: './new-survey.html',
  styleUrl: './new-survey.scss',
})
export class NewSurvey {
  @Input() variant: 'home' | 'header-create' = 'home';
  @Input() route = '/create-survey';

  private readonly router = inject(Router);

  createSurvey = output<void>();
  isSuccess = false;
  isAnimating = false;

  handleClick(): void {
    if (this.isAnimating) return;

    this.isAnimating = true;
    this.isSuccess = true;

    setTimeout(() => {
      void this.router.navigateByUrl(this.route);
    }, 600);
  }
}