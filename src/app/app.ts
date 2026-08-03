import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Dropdown } from './shared/components/dropdown/dropdown';
import { SurveyResults } from './shared/components/survey-results/survey-results';
import { SurveyDetail } from "./survey-detail/survey-detail";

@Component({
  selector: 'app-root',
  imports: [
    SurveyDetail,
    RouterOutlet,
    Dropdown,
    SurveyDetail
],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('poll-app');
}
