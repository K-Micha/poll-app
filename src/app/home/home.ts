import { Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { Header } from '../shared/layout/header/header';
import { SurveyCard } from '../shared/components/survey-card/survey-card';
import { NewSurvey } from '../shared/components/new-survey/new-survey';

@Component({
    selector: 'app-home',
    imports: [Header, SurveyCard, NewSurvey],
    templateUrl: './home.html',
    styleUrls: [
        './home.scss',
        './home-media.scss'
    ],
})

/** Controls the home page and its body styling. */
export class Home implements OnInit, OnDestroy {
    constructor(private renderer: Renderer2) { }

    /** Applies the home page background style. */
    ngOnInit(): void {
        this.renderer.addClass(document.body, 'body--home');
    }

    /** Removes the home page background style. */
    ngOnDestroy(): void {
        this.renderer.removeClass(document.body, 'body--home');
    }
}