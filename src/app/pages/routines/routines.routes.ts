import { Routes } from '@angular/router';

export const ROUTINES_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./routines').then((m) => m.Routines),
    },
    {
        path: 'create',
        loadComponent: () => import('./create/create').then((m) => m.Create),
    },
];
