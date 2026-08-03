import { Component } from '@angular/core';
import { SurveyResults } from '../shared/components/survey-results/survey-results';

@Component({
  selector: 'app-survey-detail',
  imports: [SurveyResults],
  templateUrl: './survey-detail.html',
  styleUrl: './survey-detail.scss',
})
export class SurveyDetail {}
