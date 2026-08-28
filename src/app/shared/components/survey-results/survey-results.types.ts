/** Represents a submission count. */
export type SubmissionCount = {
  count: number;
};

/** Represents a database answer row. */
export type AnswerRow = {
  id: number;
  answer_text: string;
  submission_answers: SubmissionCount[];
};

/** Represents a database question row. */
export type QuestionRow = {
  id: number;
  question_text: string;
  answers: AnswerRow[];
};

/** Represents a mapped result answer. */
export type ResultAnswer = {
  id: number;
  answerText: string;
  votes: number;
};

/** Represents a mapped result question. */
export type ResultQuestion = {
  id: number;
  questionText: string;
  answers: ResultAnswer[];
};