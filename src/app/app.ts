import { Component, inject, OnInit, signal } from '@angular/core';
import { Supabase } from './supabase';
import { Header } from "./shared/layout/header/header";

@Component({
  selector: 'app-root',
  imports: [
    Header
],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  protected readonly title = signal('poll-app');

  supabaseService = inject(Supabase);

  async ngOnInit(): Promise<void> {
    await this.supabaseService.getSurveys();
    this.supabaseService.subscribeToSurveys();
  }
}