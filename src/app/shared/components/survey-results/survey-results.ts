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

/**
 * Checks whether at least one answer has received a vote.
 * @param results Survey results to inspect.
 * @returns True when the results contain votes.
 */
function containsVotes(
  results: ResultQuestion[]
): boolean {
  return results.some((question) =>
    question.answers.some(
      (answer) => answer.votes > 0
    )
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
  styleUrls: [
    './survey-results.scss',
    './survey-results-media.scss'
  ],
})

/** Loads and prepares the live results of a survey. */
export class SurveyResults implements OnInit {
  private readonly supabaseService = inject(Supabase);

  selectedAnswers = input<Record<number, number[]>>({});
  surveyId = input.required<number>();
  results = signal<ResultQuestion[]>([]);

  hasResults = computed(() =>
    containsVotes(this.results()) || this.hasSelectedAnswers()
  );

  /** Loads the survey results when the component starts. */
  async ngOnInit(): Promise<void> {
    await this.loadResults();
  }

  /** Fetches and stores the current survey results. */
  private async loadResults(): Promise<void> {
    const { data, error } = await this.getResults();

    if (error) {
      this.handleResultsError(error);
      return;
    }

    this.results.set(
      this.mapResults(data as QuestionRow[])
    );
  }

  /** Returns database votes including the current local selection. */
  getLiveVotes(
    questionId: number,
    answerId: number,
    votes: number): number {
    const selected = this.selectedAnswers()[questionId] ?? [];

    return selected.includes(answerId)
      ? votes + 1
      : votes;
  }

  /** Reports an error while loading results. */
  private handleResultsError(error: unknown): void {
    console.error('Could not load results:', error);
  }

  /** Checks whether the current user selected an answer. */
  private hasSelectedAnswers(): boolean {
    return Object.values(this.selectedAnswers())
      .some((answers) => answers.length > 0);
  }

  /** Creates the database query for the current survey. */
  private getResults() {
    return this.supabaseService.supabase
      .from('questions')
      .select(RESULT_SELECT)
      .eq('survey_id', this.surveyId())
      .order('id', { ascending: true });
  }

  /** Maps database questions to result questions. */
  private mapResults(
    questions: QuestionRow[]
  ): ResultQuestion[] {
    return questions.map((question) => ({
      id: question.id,
      questionText: question.question_text,
      answers: this.mapAnswers(question.answers),
    }));
  }

  /** Maps and sorts database answers for the view. */
  private mapAnswers(
    answers: AnswerRow[]
  ): ResultAnswer[] {
    return [...answers]
      .sort((first, second) =>
        this.sortAnswers(first, second)
      )
      .map((answer) => this.mapAnswer(answer));
  }

  /** Sorts answers by their database ID. */
  private sortAnswers(
    first: AnswerRow,
    second: AnswerRow
  ): number {
    return first.id - second.id;
  }

  /** Maps a database answer to a result answer. */
  private mapAnswer(answer: AnswerRow): ResultAnswer {
    return {
      id: answer.id,
      answerText: answer.answer_text,
      votes: answer.submission_answers[0]?.count ?? 0,
    };
  }

  /** Returns the display letter for an answer. */
  getAnswerLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  /**
   * Calculates an answer's live percentage.
   */
  getPercentage(
    questionId: number,
    answers: ResultAnswer[],
    answer: ResultAnswer): number {
    const votes = this.getLiveVotes(
      questionId,
      answer.id,
      answer.votes
    );

    return this.calculatePercentage(
      votes, this.getTotalVotes(questionId, answers)
    );
  }

  /** Calculates the rounded percentage of votes. */
  private calculatePercentage(
    votes: number,
    total: number): number {
    return total
      ? Math.round((votes / total) * 100) : 0;
  }

  /** Calculates the total votes including the current selection. */
  private getTotalVotes(
    questionId: number,
    answers: ResultAnswer[]
  ): number {
    return answers.reduce(
      (sum, answer) =>
        sum + this.getLiveVotes(
          questionId,
          answer.id,
          answer.votes
        ),
      0
    );
  }
}