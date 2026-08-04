import { Component } from '@angular/core';
import { SurveyCard } from '../shared/components/survey-card/survey-card';

@Component({
  selector: 'app-home',
  imports: [ SurveyCard,],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {}
