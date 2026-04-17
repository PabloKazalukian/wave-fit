import { Routes } from '@angular/router';

export const MY_WEEK_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./my-week').then((m) => m.MyWeek),
    },
    {
        path: 'success',
        loadComponent: () => import('./success/success').then((m) => m.Success),
    },
];
