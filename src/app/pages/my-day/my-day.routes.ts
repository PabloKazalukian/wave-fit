import { Routes } from '@angular/router';

export const MY_DAY_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./my-day').then((m) => m.MyDay),
    },
    {
        path: 'success',
        loadComponent: () => import('./success/success').then((m) => m.Success),
    },
];
