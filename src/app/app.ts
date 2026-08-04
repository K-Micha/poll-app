import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Dropdown } from './shared/components/dropdown/dropdown';
import { Supabase } from './supabase';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    Dropdown,
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