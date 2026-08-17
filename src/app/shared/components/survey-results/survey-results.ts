import { Component, computed, inject, input, OnInit, signal, } from '@angular/core';
import { Supabase } from '../../../supabase';

type SubmissionCount = {
  count: number;
};

type AnswerRow = {
  id: number;
  answer_text: string;
  submission_answers: SubmissionCount[];
};

type QuestionRow = {
  id: number;
  question_text: string;
  answers: AnswerRow[];
};

type ResultAnswer = {
  id: number;
  answerText: string;
  votes: number;
};

type ResultQuestion = {
  id: number;
  questionText: string;
  answers: ResultAnswer[];
};

function containsVotes(
  results: ResultQuestion[]
): boolean {
  return results.some((question) =>
    question.answers.some((answer) => answer.votes > 0)
  );
}

const RESULT_SELECT = `
  id,
  question_text,
  answers (id, answer_text, submission_answers (count))`;


@Component({
  selector: 'app-survey-results',
  imports: [],
  templateUrl: './survey-results.html',
  styleUrl: './survey-results.scss',
})
export class SurveyResults implements OnInit {
  private readonly supabaseService = inject(Supabase);

  surveyId = input.required<number>();
  results = signal<ResultQuestion[]>([]);

  hasResults = computed(() =>
    containsVotes(this.results())
  );

  async ngOnInit(): Promise<void> {
    await this.loadResults();
  }

  private async loadResults(): Promise<void> {
    const { data, error } = await this.getResults();

    if (error) {
      this.handleResultsError(error);
      return;
    }

    this.results.set(this.mapResults(data as QuestionRow[]));
  }

  private handleResultsError(error: unknown): void {
    console.error('Could not load results:', error);
  }

  private getResults() {
    return this.supabaseService.supabase
      .from('questions')
      .select(RESULT_SELECT)
      .eq('survey_id', this.surveyId())
      .order('id', { ascending: true });
  }

  private mapResults(
    questions: QuestionRow[]
  ): ResultQuestion[] {
    return questions.map((question) => ({
      id: question.id,
      questionText: question.question_text,
      answers: this.mapAnswers(question.answers),
    }));
  }

  private mapAnswers(
    answers: AnswerRow[]
  ): ResultAnswer[] {
    return answers
      .sort((first, second) => first.id - second.id)
      .map((answer) => ({
        id: answer.id,
        answerText: answer.answer_text,
        votes:
          answer.submission_answers[0]?.count ?? 0,
      }));
  }

  getAnswerLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  getPercentage(
    answers: ResultAnswer[],
    votes: number
  ): number {
    const total = answers.reduce(
      (sum, answer) => sum + answer.votes,
      0
    );

    if (!total) return 0;

    return Math.round((votes / total) * 100);
  }
}