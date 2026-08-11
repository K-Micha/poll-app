import { Injectable, OnDestroy, signal, } from '@angular/core';
import { createClient, RealtimeChannel, } from '@supabase/supabase-js';

type Survey = {
  id: number;
  created_at: string;
  updated_at: string | null;
  title: string;
  description: string;
  category: string;
  end_date: string | null;
  status: string;
  is_demo: boolean;
};

@Injectable({
  providedIn: 'root',
})

export class Supabase implements OnDestroy {
  private readonly supabaseUrl =
    'https://rnwpzflsvaqgzoznhshb.supabase.co';

  private readonly supabaseKey =
    'sb_publishable_YRXsZrOvr6dAMaKGOYdXkg_TFenbD8L';

  readonly supabase = createClient(
    this.supabaseUrl,
    this.supabaseKey
  );

  readonly surveys = signal<Survey[]>([]);

  private channel?: RealtimeChannel;

  async getSurveys(): Promise<void> {
    const { data, error } = await this.supabase
      .from('surveys')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Could not load surveys:', error);
      return;
    }

    this.surveys.set(data);
  }

  subscribeToSurveys(): void {
    if (this.channel) {
      return;
    }

    this.channel = this.createSurveysChannel();
  }

  private createSurveysChannel(): RealtimeChannel {
    return this.supabase
      .channel('surveys-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'surveys',
        },
        () => void this.getSurveys()
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    if (this.channel) {
      void this.supabase.removeChannel(this.channel);
    }
  }
}