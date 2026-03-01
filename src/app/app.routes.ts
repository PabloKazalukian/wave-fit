import { Routes } from '@angular/router';
import { authGuard } from './core/auth-guard';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/home/home').then((m) => m.Home),
        canActivate: [authGuard],
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
        canActivate: [authGuard],
    },
    {
        path: 'my-day',
        loadComponent: () => import('./pages/my-day/my-day').then((m) => m.MyDay),
        canActivate: [authGuard],
    },
    {
        path: 'user',
        loadComponent: () => import('./pages/user/user').then((m) => m.User),
        canActivate: [authGuard],
    },
    {
        path: 'routines',
        loadChildren: () =>
            import('./pages/routines/routines.routes').then((m) => m.ROUTINES_ROUTES),
        canActivate: [authGuard],
    },
    { path: '**', redirectTo: '' },
];
