import { Component } from '@angular/core';
import { SurveyCard } from '../shared/components/survey-card/survey-card';
import { Header } from '../shared/layout/header/header';

@Component({
  selector: 'app-home',
  imports: [ SurveyCard, Header],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {}
