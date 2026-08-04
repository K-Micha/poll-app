import { Injectable, signal } from '@angular/core';
import {
  createClient,
  RealtimeChannel,
} from '@supabase/supabase-js';

type Survey = {
  id: number;
  created_at: string;
  updated_at: string | null;
  title: string;
  description: string;
  category: string;
  end_date: string | null;
  status: string;
};

@Injectable({
  providedIn: 'root',
})
export class Supabase {
  supabaseUrl = 'https://rnwpzflsvaqgzoznhshb.supabase.co';

  supabaseKey =
    'sb_publishable_YRXsZrOvr6dAMaKGOYdXkg_TFenbD8L';

  supabase = createClient(
    this.supabaseUrl,
    this.supabaseKey
  );

  surveys = signal<Survey[]>([]);

  channel: RealtimeChannel | undefined;

  async getSurveys(): Promise<void> {
    const { data, error } = await this.supabase
      .from('surveys')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('Surveys data:', data);
    console.log('Surveys error:', error);

    if (error) {
      console.error('Could not load surveys:', error);
      return;
    }

    this.surveys.set(data);
  }

  subscribeToSurveys(): void {
    this.channel = this.supabase
      .channel('surveys-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'surveys',
        },
        () => {
          this.getSurveys();
        }
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    if (this.channel) {
      this.supabase.removeChannel(this.channel);
    }
  }
}