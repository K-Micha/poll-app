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
/** Defines the header color variant. */
  @Input() variant: 'orange' | 'purple' = 'purple';

/** Defines the new survey button variant. */
  @Input() buttonVariant: 'home' | 'header-create' = 'home';

/** Defines the displayed logo source. */
  @Input() logoSrc = '/app-icons/logo-orange.svg';

/** Controls whether the new survey button is shown. */
  @Input() showButton = false;

/** Emits when a new survey should be created. */
  createSurvey = output<void>();
}