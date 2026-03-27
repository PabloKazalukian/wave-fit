import { Routes } from '@angular/router';

export const PLANS_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./plans').then((m) => m.Plans),
    },
    {
        path: 'create',
        loadComponent: () => import('./create/create').then((m) => m.Create),
    },
];
