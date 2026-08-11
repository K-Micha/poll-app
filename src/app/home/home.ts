import { Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { Header } from '../shared/layout/header/header';
import { SurveyCard } from '../shared/components/survey-card/survey-card';

@Component({
  selector: 'app-home',
  imports: [ Header, SurveyCard],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})

export class Home implements OnInit, OnDestroy {
    constructor(private renderer: Renderer2) {}

    ngOnInit(): void {
        this.renderer.addClass(document.body, 'body--home');
    }

    ngOnDestroy(): void {
        this.renderer.removeClass(document.body, 'body--home');
    }
}
