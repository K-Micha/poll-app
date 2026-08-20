import { Component, signal } from '@angular/core';
import { Dropdown } from '../shared/components/dropdown/dropdown';

@Component({
  selector: 'app-create-survey',
  imports: [Dropdown],
  templateUrl: './create-survey.html',
  styleUrl: './create-survey.scss',
})
export class CreateSurvey {
  questions = [
    {
      text: 'Which date would work best for you?',
      answers: [
        { text: '' },
        { text: '' }
      ]
    }
  ];

  addQuestion(): void {
    this.questions.push({
      text: '',
      answers: [
        { text: '' },
        { text: '' }
      ]
    });
  }

  addAnswer(questionIndex: number): void {
    this.questions[questionIndex].answers.push({ text: '' });
  }

  getAnswerLetter(answerIndex: number): string {
    return String.fromCharCode(65 + answerIndex);
  }
}
