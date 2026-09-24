import { Routes } from '@angular/router';
import { Trackings } from './trackings';
import { Show } from './show/show';

export const TRACKINGS_ROUTES: Routes = [
    {
        path: '',
        component: Trackings,
    },
    {
        path: ':id',
        component: Show,
    },
];
