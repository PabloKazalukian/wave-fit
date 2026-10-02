import { Routes } from '@angular/router';

/**
 * Rutas del grupo `/stats` (FR-001).
 *
 * `''` conserva el dashboard y `'insights'` agrega la analítica por rango de
 * fechas: son dos páginas hermanas, no una extensión de la anterior — comparten
 * el tema de Highcharts, `app-stats-section` y `app-stats-chart`, pero sus
 * datos vienen de fuentes distintas (snapshots del worker vs agregación on
 * demand).
 *
 * Ambas son lazy y ninguna lleva `canActivate`: el guard vive en la entrada
 * `stats` de `app.routes.ts`, así que `/stats/insights` lo hereda y no se puede
 * olvidar en un hijo nuevo.
 *
 * El header no necesita cambios: `isActive()` compara con `startsWith`, de modo
 * que la entrada `/stats` sigue resaltada en las dos rutas (FR-002).
 */
export const STATS_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./stats').then((m) => m.StatsPage),
    },
    {
        path: 'insights',
        loadComponent: () =>
            import('./stats-insights/stats-insights').then((m) => m.StatsInsightsPage),
    },
];
