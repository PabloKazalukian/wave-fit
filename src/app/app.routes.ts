import { Routes } from '@angular/router';
import { authGuard } from './core/auth-guard';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/home/home').then((m) => m.Home),
    },
    {
        path: 'auth',
        loadChildren: () => import('./pages/auth/auth.routes').then((m) => m.AUTH_ROUTES),
    },
    {
        path: 'exercise',
        redirectTo: 'exercises',
        pathMatch: 'full',
    },
    {
        path: 'exercises',
        loadChildren: () =>
            import('./pages/exercises/exercises.routes').then((m) => m.EXERCISES_ROUTES),
    },
    {
        path: 'user',
        loadComponent: () => import('./pages/user/user').then((m) => m.User),
        // canActivate: [authGuard],
    },
    {
        path: 'routines',
        loadChildren: () =>
            import('./pages/routines/routines.routes').then((m) => m.ROUTINES_ROUTES),
    },
    { path: '**', redirectTo: '' },
];
