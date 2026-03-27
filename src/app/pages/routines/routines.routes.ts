import { Routes } from '@angular/router';

export const ROUTINES_ROUTES: Routes = [
    {
        path: 'show/:id',
        loadComponent: () => import('./show/show').then((m) => m.Show),
    },
];
