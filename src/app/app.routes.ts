import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./home/home').then((m) => m.Home),
    },
    {
        path: 'survey-detail/:id',
        loadComponent: () =>
            import('./survey-detail/survey-detail')
                .then((m) => m.SurveyDetail),
    },
    {
        path: 'create-survey',
        loadComponent: () =>
            import('./create-survey/create-survey')
                .then((m) => m.CreateSurvey),
    },
    {
        path: '**',
        redirectTo: '',
    },
];