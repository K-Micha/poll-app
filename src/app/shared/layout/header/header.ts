import { Component, Input, output } from '@angular/core';
import { NewSurvey } from '../../components/new-survey/new-survey';

@Component({
  selector: 'app-header',
  imports: [NewSurvey],
  templateUrl: './header.html',
  styleUrls: [
    './header.scss',
    './header-media.scss'
  ],
})

/** Displays the configurable page header. */
export class Header {
  @Input() variant: 'orange' | 'purple' = 'purple';
  @Input() buttonVariant: 'home' | 'header-create' = 'home';
  @Input() logoSrc = '/app-icons/logo-orange.svg';
  @Input() showButton = false;

  createSurvey = output<void>();
}