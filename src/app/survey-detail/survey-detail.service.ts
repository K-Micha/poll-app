import { Injectable, inject } from '@angular/core';
import { Supabase } from '../supabase';

type SelectedAnswers = Record<number, number[]>;

type SubmissionAnswer = {
  submission_id: number;
  question_id: number;
  answer_id: number;
};

@Injectable({
  providedIn: 'root',
})

/** Handles survey submissions. */
export class SurveyDetailService {
  private readonly supabaseService = inject(Supabase);

/**
* Saves a survey submission.
* @param surveyId ID of the survey.
* @param selectedAnswers Selected survey answers.
* @returns Whether the submission was saved.
*/
  async saveSurvey(
    surveyId: number,
    selectedAnswers: SelectedAnswers): Promise<boolean> {

    const submissionId = await this.createSubmission(surveyId);

    if (submissionId === null) return false;

    return this.saveSubmissionAnswers(
      submissionId,
      selectedAnswers
    );
  }

  /**
   * Creates a new survey submission.
   * @param surveyId ID of the survey.
   * @returns ID of the created submission.
   */
  private async createSubmission(
    surveyId: number ): Promise<number | null> {
    const { data, error } = await this.supabaseService.supabase
      .from('submissions')
      .insert({ survey_id: surveyId })
      .select('id')
      .single();

    if (!error) return data.id;

    console.error('Could not create submission:', error);
    return null;
  }

/**
* Stores all selected submission answers.
* @param submissionId ID of the submission.
* @param selectedAnswers Selected survey answers.
* @returns Whether the answers were stored.
*/
  private async saveSubmissionAnswers(
    submissionId: number,
    selectedAnswers: SelectedAnswers
  ): Promise<boolean> {

    const answers = this.getSubmissionAnswers(
      submissionId,
      selectedAnswers
    );

    const { error } = await this.supabaseService.supabase
      .from('submission_answers')
      .insert(answers);

    if (!error) return true;

    console.error('Could not save answers:', error);
    return false;
  }

/**
* Creates database rows for selected answers.
* @param submissionId ID of the submission.
* @param selectedAnswers Selected survey answers.
* @returns Submission answer rows.
*/
  private getSubmissionAnswers(
    submissionId: number,
    selectedAnswers: SelectedAnswers
  ): SubmissionAnswer[] {

    return Object.entries(selectedAnswers)
      .flatMap(([questionId, answerIds]) =>
        answerIds.map((answerId) => ({
          submission_id: submissionId,
          question_id: Number(questionId),
          answer_id: answerId,
        }))
      );
  }
}