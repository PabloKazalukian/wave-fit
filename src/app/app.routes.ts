import { Routes } from '@angular/router';
import { authGuard } from './core/auth-guard';

export const routes: Routes = [
    {
        path: 'home',
        loadComponent: () => import('./pages/home/home').then((m) => m.Home),
        canActivate: [authGuard],
    },
    {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
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
        path: 'my-week',
        loadChildren: () => import('./pages/my-week/my-week.routes').then((m) => m.MY_WEEK_ROUTES),
        canActivate: [authGuard],
    },
    {
        path: 'user',
        canActivate: [authGuard],
        children: [
            {
                path: '',
                loadComponent: () => import('./pages/user/user').then((m) => m.User),
            },
            {
                path: 'trackings',
                loadChildren: () =>
                    import('./pages/trackings/tracking.routes').then((m) => m.TRACKINGS_ROUTES),
            },
        ],
    },
    {
        path: 'plans',
        loadChildren: () => import('./pages/plans/plans.routes').then((m) => m.PLANS_ROUTES),
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
