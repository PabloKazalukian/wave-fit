import { Routes } from '@angular/router';
import { authGuard } from './core/auth-guard';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/home/home').then((m) => m.Home),
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
    },
    {
        path: 'auth',
        loadChildren: () => import('./pages/auth/auth.routes').then((m) => m.AUTH_ROUTES),
    },
    { path: '**', redirectTo: '' },
];
