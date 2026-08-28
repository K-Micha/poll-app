import type { Answer, Question } from './create-survey.service';

const FIRST_ANSWER_LETTER_CODE = 65;
const REQUIRED_ANSWER_COUNT = 2;
const REMOVE_ITEM_COUNT = 1;

/**
* Creates an empty survey question.
* @returns Empty survey question.
*/
export function createEmptyQuestion(): Question {
    return {
        text: '',
        multipleAnswers: false,
        answers: [
            { text: '' },
            { text: '' }
        ],
    };
}

/**
* Clears a required answer or removes an additional one.
* @param answers Answers of the selected question.
* @param answerIndex Position of the selected answer.
*/
export function clearOrRemoveAnswer(
    answers: Answer[],
    answerIndex: number): void {

    if (answerIndex < REQUIRED_ANSWER_COUNT) {
        answers[answerIndex].text = '';
        return;
    }

    answers.splice(answerIndex, REMOVE_ITEM_COUNT);
}

/**
* Reads a form field value.
* @param event Form field event.
* @returns Current field value.
*/
export function getFieldValue(event: Event): string {
    const field = event.target as HTMLInputElement | HTMLTextAreaElement;

    return field.value;
}

/**
* Converts an answer index into a letter.
* @param answerIndex Position of the answer.
* @returns Uppercase answer letter.
*/
export function getAnswerLetter(
    answerIndex: number): string {

    return String.fromCharCode(FIRST_ANSWER_LETTER_CODE + answerIndex);
}