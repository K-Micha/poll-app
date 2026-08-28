/** Represents a survey answer. */
export type SurveyAnswer = {
    id: number;
    answer_text: string;
};

/** Represents a survey question with its answers. */
export type SurveyQuestion = {
    id: number;
    question_text: string;
    allow_multiple: boolean;
    answers: SurveyAnswer[];
};

/** Represents a survey with its questions. */
export type Survey = {
    id: number;
    title: string;
    description: string;
    status: string;
    category: string;
    end_date: string | null;
    is_demo: boolean;
    questions: SurveyQuestion[];
};

/** Represents a stored submission answer. */
export type SubmissionAnswer = {
    submission_id: number;
    question_id: number;
    answer_id: number;
};