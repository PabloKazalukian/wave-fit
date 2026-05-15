import { Routes } from '@angular/router';
import { guestGuard } from '../../core/auth-guard';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login').then((m) => m.Login),
    canActivate: [guestGuard]
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register').then((m) => m.Register),
    canActivate: [guestGuard]
  },
  {
    path: 'callback',
    loadComponent: () => import('./callback/callback').then((m) => m.Callback),
    canActivate: [guestGuard]
  }
];
