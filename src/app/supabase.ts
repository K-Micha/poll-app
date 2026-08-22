import { Injectable, OnDestroy, signal, } from '@angular/core';
import { createClient, RealtimeChannel, } from '@supabase/supabase-js';

export type CreateAnswer = { text: string; };

export type CreateQuestion = {
  text: string;
  multipleAnswers: boolean;
  answers: CreateAnswer[];
};

export type CreateSurvey = {
  title: string;
  description: string;
  category: string;
  endDate: string | null;
  questions: CreateQuestion[];
};

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

/** Handles survey data and realtime database updates. */
export class Supabase implements OnDestroy {
  private readonly supabaseUrl = 'https://rnwpzflsvaqgzoznhshb.supabase.co';

  private readonly supabaseKey = 'sb_publishable_YRXsZrOvr6dAMaKGOYdXkg_TFenbD8L';

  readonly supabase = createClient(this.supabaseUrl, this.supabaseKey);

  readonly surveys = signal<Survey[]>([]);

  private channel?: RealtimeChannel;

  /**
   * Creates a survey with its questions and answers.
   * @param survey Prepared survey data.
   * @returns ID of the created survey.
   */
  async createSurvey(
    survey: CreateSurvey): Promise<number> {

    const surveyId = await this.insertSurvey(survey);

    await this.insertQuestions(surveyId, survey.questions);

    await this.getSurveys();

    return surveyId;
  }

  /** Inserts the main survey row. */
  private async insertSurvey(
    survey: CreateSurvey): Promise<number> {

    const { data, error } = await this.supabase
      .from('surveys')
      .insert(this.createSurveyRow(survey))
      .select('id')
      .single();

    if (error) throw error;

    return data.id;
  }

  /** Creates the database row for a survey. */
  private createSurveyRow(survey: CreateSurvey) {
    return {
      title: survey.title,
      description: survey.description,
      category: survey.category,
      end_date: survey.endDate,
      status: 'published',
      is_demo: false,
    };
  }

  /** Inserts all questions belonging to a survey. */
  private async insertQuestions(
    surveyId: number,
    questions: CreateQuestion[]): Promise<void> {

    for (const [index, question] of questions.entries()) {
      await this.insertQuestion(surveyId, question, index);
    }
  }

  /** Inserts one question and its answers. */
  private async insertQuestion(
    surveyId: number,
    question: CreateQuestion,
    index: number): Promise<void> {

    const questionId = await this.createQuestion(
      surveyId,
      question,
      index
    );

    await this.insertAnswers(questionId, question.answers);
  }

  /** Creates one question and returns its ID. */
  private async createQuestion(
    surveyId: number,
    question: CreateQuestion,
    index: number): Promise<number> {

    const { data, error } = await this.supabase
      .from('questions')
      .insert(this.createQuestionRow(
        surveyId,
        question,
        index
      ))
      .select('id')
      .single();

    if (error) throw error;

    return data.id;
  }

  /** Creates the database row for a question. */
  private createQuestionRow(
    surveyId: number,
    question: CreateQuestion,
    index: number
  ) {
    return {
      survey_id: surveyId,
      question_text: question.text,
      allow_multiple: question.multipleAnswers,
      position: index + 1,
    };
  }

  /** Inserts all answers belonging to a question. */
  private async insertAnswers(
    questionId: number,
    answers: CreateAnswer[]): Promise<void> {

    const answerRows = answers.map((answer, index) => ({
      question_id: questionId,
      answer_text: answer.text,
      position: index + 1,
    }));

    const { error } = await this.supabase
      .from('answers')
      .insert(answerRows);

    if (error) throw error;
  }

  /** Loads all surveys from the database. */
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

  /** Starts listening for survey database changes. */
  subscribeToSurveys(): void {
    if (this.channel) return;

    this.channel = this.createSurveysChannel();
  }

  /** Creates the realtime survey channel. */
  private createSurveysChannel(): RealtimeChannel {
    return this.supabase
      .channel('surveys-channel')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'surveys',
        },
        () => void this.getSurveys()
      )
      .subscribe();
  }

  /** Removes the realtime channel when the service is destroyed. */
  ngOnDestroy(): void {
    if (this.channel) { void this.supabase.removeChannel(this.channel); }
  }
}