import { Component } from '@angular/core';
import { Dropdown } from '../dropdown/dropdown';

@Component({
  selector: 'app-survey-card',
  imports: [Dropdown],
  templateUrl: './survey-card.html',
  styleUrl: './survey-card.scss',
})
export class SurveyCard {}
