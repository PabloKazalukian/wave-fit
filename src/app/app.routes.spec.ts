import { Route } from '@angular/router';
import { authGuard } from './core/auth-guard';
import { routes } from './app.routes';
import { STATS_ROUTES } from './pages/stats/stats.routes';

/**
 * TEST-022 (sdd/stats-insights/spec.md, FR-001 + BR-005).
 *
 * `/stats` deja de ser una hoja y pasa a ser un `loadChildren` con dos hijos,
 * para que `/stats/insights` tenga un padre real y la relación page↔dashboard
 * quede en el routing y no en la convención.
 *
 * El test es estructural a propósito: `loadComponent` devuelve una promesa y
 * resolverlo exigiría montar las páginas de verdad (con Apollo y Highcharts).
 * Lo que importa acá es que las rutas existan, sean lazy y estén protegidas.
 */
describe('Routing de /stats y /stats/insights (TEST-022)', () => {
    const statsRoute = (): Route => {
        const route = routes.find((r) => r.path === 'stats');
        expect(route).withContext('la ruta "stats" debe existir').toBeDefined();
        return route as Route;
    };

    describe('app.routes.ts', () => {
        it('carga /stats con loadChildren en vez de loadComponent', () => {
            const route = statsRoute();

            expect(route.loadChildren).withContext('debe delegar en STATS_ROUTES').toBeDefined();
            expect(route.loadComponent).withContext('ya no puede ser una hoja').toBeUndefined();
        });

        it('protege /stats con authGuard (BR-005)', () => {
            expect(statsRoute().canActivate).toEqual([authGuard]);
        });
    });

    describe('STATS_ROUTES', () => {
        const child = (path: string): Route => {
            const route = STATS_ROUTES.find((r) => r.path === path);
            expect(route).withContext(`debe existir el hijo "${path}"`).toBeDefined();
            return route as Route;
        };

        it('tiene exactamente dos hijos: el dashboard y insights', () => {
            expect(STATS_ROUTES.map((r) => r.path)).toEqual(['', 'insights']);
        });

        it('mantiene el dashboard en la ruta vacía y lo carga lazy', () => {
            expect(child('').loadComponent).toBeDefined();
        });

        it('carga insights lazy, sin canActivate propio (lo hereda del padre)', () => {
            expect(child('insights').loadComponent).toBeDefined();
            expect(child('insights').canActivate)
                .withContext('el guard vive en el padre')
                .toBeUndefined();
        });

        it('no declara redirect en el hijo vacío: /stats tiene que renderizar la page', () => {
            expect(child('').redirectTo)
                .withContext('sin redirect, /stats resuelve en el dashboard')
                .toBeUndefined();
            expect(child('').pathMatch)
                .withContext('pathMatch solo aplica a redirects')
                .toBeUndefined();
        });
    });
});
