import { Routes } from '@angular/router';

export const EXERCISES_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./exercises').then((m) => m.Exercises),
    },
    // {
    // path: 'create',
    // loadComponent: () => import('./create/create').then((m) => m.Create),
    // },
];
