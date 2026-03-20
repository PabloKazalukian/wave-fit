import { Routes } from '@angular/router';
import { Trackings } from './trackings';
import { Stats } from './stats/stats';
import { Show } from './show/show';

export const TRACKINGS_ROUTES: Routes = [
    {
        path: '',
        component: Trackings,
    },
    {
        path: 'stats',
        component: Stats,
    },
    {
        path: ':id',
        component: Show,
    },
];
