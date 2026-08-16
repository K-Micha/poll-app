import { Component, Input } from '@angular/core';
import { NewSurvey } from '../../components/new-survey/new-survey';

@Component({
  selector: 'app-header',
  imports: [NewSurvey],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  @Input() variant: 'orange' | 'purple' = 'purple';
  @Input() logoSrc = '/icons/logo-orange.svg';
  @Input() showButton = false;
  
}