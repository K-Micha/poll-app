import { Component, computed, inject, input, OnInit, signal, } from '@angular/core';
import { Supabase } from '../../../supabase';
import { AnswerRow, QuestionRow, ResultAnswer, ResultQuestion } from './survey-results.types';

const FIRST_ANSWER_LETTER_CODE = 65;
const PERCENTAGE_FACTOR = 100;


/**
* Checks whether at least one answer has received a vote.
* @param results Survey results to inspect.
* @returns Whether the results contain votes.
*/
function containsVotes(
  results: ResultQuestion[]): boolean {

  return results.some((question) =>
    question.answers.some((answer) => answer.votes > 0
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

  /**
  * Returns database votes including the current local selection.
  * @param questionId ID of the question.
  * @param answerId ID of the answer.
  * @param votes Stored vote count.
  * @returns Live vote count.
  */
  getLiveVotes(
    questionId: number,
    answerId: number,
    votes: number): number {

    const selected = this.selectedAnswers()[questionId] ?? [];

    return selected.includes(answerId)
      ? votes + 1
      : votes;
  }

  /**
  * Reports an error while loading results.
  * @param error Result loading error.
  */
  private handleResultsError(error: unknown): void {
    console.error('Could not load results:', error);
  }

  /**
  * Checks whether the current user selected an answer.
  * @returns Whether an answer is selected.
  */
  private hasSelectedAnswers(): boolean {
    return Object.values(this.selectedAnswers())
      .some((answers) => answers.length > 0);
  }

  /**
  * Creates the database query for the current survey.
  * @returns Database query for survey results.
  */
  private getResults() {
    return this.supabaseService.supabase
      .from('questions')
      .select(RESULT_SELECT)
      .eq('survey_id', this.surveyId())
      .order('id', { ascending: true });
  }

  /**
  * Maps database questions to result questions.
  * @param questions Database question rows.
  * @returns Mapped result questions.
  */
  private mapResults(
    questions: QuestionRow[]): ResultQuestion[] {

    return questions.map((question) => ({
      id: question.id,
      questionText: question.question_text,
      answers: this.mapAnswers(question.answers),
    }));
  }

  /**
  * Maps and sorts database answers for the view.
  * @param answers Database answer rows.
  * @returns Mapped result answers.
  */
  private mapAnswers(
    answers: AnswerRow[]): ResultAnswer[] {

    return [...answers]
      .sort((first, second) =>
        this.sortAnswers(first, second)
      )
      .map((answer) => this.mapAnswer(answer));
  }

  /**
  * Sorts answers by their database ID.
  * @param first First answer.
  * @param second Second answer.
  * @returns Sort order.
  */
  private sortAnswers(
    first: AnswerRow,
    second: AnswerRow): number {

    return first.id - second.id;
  }

  /**
  * Maps a database answer to a result answer.
  * @param answer Database answer row.
  * @returns Mapped result answer.
  */
  private mapAnswer(answer: AnswerRow): ResultAnswer {
    return {
      id: answer.id,
      answerText: answer.answer_text,
      votes: answer.submission_answers[0]?.count ?? 0,
    };
  }

  /**
  * Returns the display letter for an answer.
  * @param index Index of the answer.
  * @returns Display letter.
  */
  getAnswerLetter(index: number): string {
    return String.fromCharCode(
      FIRST_ANSWER_LETTER_CODE + index
    );
  }

  /**
  * Calculates an answer's live percentage.
  * @param questionId ID of the question.
  * @param answers Answers belonging to the question.
  * @param answer Answer to calculate.
  * @returns Live percentage.
  */
  getPercentage(
    questionId: number,
    answers: ResultAnswer[],
    answer: ResultAnswer
  ): number {
    const percentages = this.getPercentages(questionId, answers);
    const index = answers.findIndex((item) => item.id === answer.id);

    return percentages[index] ?? 0;
  }

/**
* Calculates all answer percentages for a question.
* @param questionId ID of the question.
* @param answers Answers belonging to the question.
* @returns Percentages for all answers.
*/
  private getPercentages(
    questionId: number,
    answers: ResultAnswer[]
  ): number[] {
    const votes = answers.map(a =>
      this.getLiveVotes(questionId, a.id, a.votes)
    );

    const total = votes.reduce((sum, vote) => sum + vote, 0);
    if (!total) return votes.map(() => 0);

    return this.adjustPercentages(votes, total);
  }

/**
* Adjusts rounded percentages to total exactly 100.
* @param votes Vote counts.
* @param total Total number of votes.
* @returns Adjusted percentages.
*/
  private adjustPercentages(votes: number[], total: number): number[] {
    const raw = votes.map(vote => vote / total * PERCENTAGE_FACTOR);
    const result = raw.map(Math.floor);
    let rest = PERCENTAGE_FACTOR - result.reduce((sum, value) => sum + value, 0);

    raw
      .map((value, index) => ({ index, rest: value % 1 }))
      .sort((a, b) => b.rest - a.rest)
      .slice(0, rest)
      .forEach(item => result[item.index]++);

    return result;
  }

  /**
  * Calculates the total votes including the current selection.
  * @param questionId ID of the question.
  * @param answers Answers belonging to the question.
  * @returns Total vote count.
  */
  private getTotalVotes(
    questionId: number,
    answers: ResultAnswer[]): number {
    return answers.reduce(
      (sum, answer) => sum + this.getLiveVotes(
        questionId,
        answer.id,
        answer.votes
      ),
      0
    );
  }
}