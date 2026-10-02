import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError, type Observable } from 'rxjs';
import { provideHighcharts } from 'highcharts-angular';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { StatsInsightsControls } from '../../../shared/components/widgets/stats/stats-insights-controls/stats-insights-controls';
import { StatsInsightsCard } from '../../../shared/components/widgets/stats/stats-insights-card/stats-insights-card';
import { StatsDateRange } from '../../../shared/components/widgets/stats/stats-date-range/stats-date-range';
import { StatsInsightsPage } from './stats-insights';
import { StatsInsightsService } from '../../../core/services/stats/stats-insights.service';
import { DateService } from '../../../core/services/date.service';
import type {
    CaloriesWeekVM,
    ExerciseTrendVM,
    ForgottenMuscleVM,
    LocalDateRange,
    OneRmExerciseVM,
    StatsInsightsSection,
    VolumeTotalWeekVM,
    VolumeWeekVM,
} from '../../../shared/interfaces/stats-insights.interface';
import type { StatsCategory } from '../../../shared/interfaces/stats.interface';

type GetterName =
    | 'getOneRmWeekly'
    | 'getVolumeWeekly'
    | 'getVolumeTotalWeekly'
    | 'getCaloriesWeekly'
    | 'getForgottenMuscles'
    | 'getExerciseTrend';

const getterBySection: Record<StatsInsightsSection, GetterName> = {
    oneRm: 'getOneRmWeekly',
    volume: 'getVolumeWeekly',
    volumeTotal: 'getVolumeTotalWeekly',
    calories: 'getCaloriesWeekly',
    forgottenMuscles: 'getForgottenMuscles',
    exerciseTrend: 'getExerciseTrend',
};

interface ServiceStub {
    getOneRmWeekly: jasmine.Spy;
    getVolumeWeekly: jasmine.Spy;
    getVolumeTotalWeekly: jasmine.Spy;
    getCaloriesWeekly: jasmine.Spy;
    getForgottenMuscles: jasmine.Spy;
    getExerciseTrend: jasmine.Spy;
}

/**
 * TEST-021 (sdd/stats-insights/spec.md, FR-002, FR-011, FR-015, FR-020, FR-022,
 * FR-023), reescrito para el flujo encadenado.
 *
 * La page es un orquestador delgado: no consulta, no persiste y no arma options de
 * Highcharts. Lo que se verifica acá es el contrato de arriba — que entrar no
 * consulta nada, que sólo "Ver gráficas" dispara, que dispara **una** sección, que
 * no hay card sin métrica elegida, y que un error levanta una notificación global
 * sin tocar el resto.
 *
 * El flujo de usuario se ejercita a través de `app-stats-insights-controls` (set del
 * `FormControl` del select + click del botón), no llamando a `onRun()` directo:
 * esa es la cadena que el usuario realmente recorre, y probarla así cubre el
 * widget de paso.
 *
 * `StatsInsightsState` es real (es la lógica de la feature); el servicio va
 * mockeado, igual que en `stats.spec.ts`.
 */
describe('StatsInsightsPage (TEST-021)', () => {
    // El widget se siembra con los últimos 30 días que calcula el state, así que
    // el reloj se fija para que el rango sea un valor esperado y no "hoy".
    const TODAY = '2026-09-01';
    const SEED_RANGE: LocalDateRange = { from: '2026-08-03', to: '2026-09-01' };
    const RANGE: LocalDateRange = { from: '2026-08-01', to: '2026-08-30' };

    let fixture: ComponentFixture<StatsInsightsPage>;
    let service: ServiceStub;

    const chest = 'chest' as StatsCategory;

    const oneRm: OneRmExerciseVM[] = [
        {
            exerciseId: 'ex-1',
            name: 'Press banca',
            category: chest,
            weeks: [
                {
                    weekKey: '2026-W40',
                    best1RM: 100,
                    weightUsed: 90,
                    reps: 5,
                    participated: true,
                },
                {
                    weekKey: '2026-W41',
                    best1RM: null,
                    weightUsed: null,
                    reps: null,
                    participated: false,
                },
            ],
        },
    ];

    const volume: VolumeWeekVM[] = [
        {
            weekKey: '2026-W40',
            exercises: [{ exerciseId: 'ex-1', name: 'Press banca', category: chest, volume: 4500 }],
            muscles: [{ muscle: 'chest', label: 'Pecho', sets: 4, volume: 4500 }],
        },
    ];

    const volumeTotal: VolumeTotalWeekVM[] = [
        { weekKey: '2026-W40', totalVolume: 12000, deltaPct: null, possibleDeload: false },
    ];

    const calories: CaloriesWeekVM[] = [
        {
            weekKey: '2026-W40',
            routineKcal: null,
            extraKcal: 320,
            totalKcal: 320,
            estimatedSessions: 2,
        },
    ];

    const forgotten: ForgottenMuscleVM[] = [
        {
            muscle: 'legs',
            label: 'Piernas',
            totalSets: 2,
            weeksWithoutWork: 3,
            lastTrainedAt: null,
        },
    ];

    const trend: ExerciseTrendVM[] = [
        {
            exerciseId: 'ex-1',
            name: 'Press banca',
            category: chest,
            slope: 1.5,
            pctChange: 12,
            label: 'UP',
            weeksUsed: 4,
        },
        {
            exerciseId: 'ex-2',
            name: 'Sentadilla',
            category: 'legs' as StatsCategory,
            slope: null,
            pctChange: null,
            label: 'INSUFFICIENT',
            weeksUsed: 2,
        },
    ];

    const buildService = (): ServiceStub => ({
        getOneRmWeekly: jasmine.createSpy('getOneRmWeekly').and.returnValue(of(oneRm)),
        getVolumeWeekly: jasmine.createSpy('getVolumeWeekly').and.returnValue(of(volume)),
        getVolumeTotalWeekly: jasmine
            .createSpy('getVolumeTotalWeekly')
            .and.returnValue(of(volumeTotal)),
        getCaloriesWeekly: jasmine.createSpy('getCaloriesWeekly').and.returnValue(of(calories)),
        getForgottenMuscles: jasmine
            .createSpy('getForgottenMuscles')
            .and.returnValue(of(forgotten)),
        getExerciseTrend: jasmine.createSpy('getExerciseTrend').and.returnValue(of(trend)),
    });

    const createFixture = async (
        stub: ServiceStub,
    ): Promise<ComponentFixture<StatsInsightsPage>> => {
        // Los escenarios de error necesitan su propia instancia del TestBed con
        // el servicio ya stubeado para fallar; sin reset, la segunda
        // configuración choca con la instancia anterior.
        TestBed.resetTestingModule();
        await TestBed.configureTestingModule({
            imports: [StatsInsightsPage],
            providers: [
                provideHighcharts(),
                // `app-text-link` navega con `routerLink`, que necesita un
                // ActivatedRoute aunque el test no ejercite la navegación.
                provideRouter([]),
                { provide: StatsInsightsService, useValue: stub },
            ],
        }).compileComponents();

        // Antes de crear la page: el state calcula el rango semilla en su
        // inicializador, así que el reloj tiene que estar fijado antes.
        spyOn(TestBed.inject(DateService), 'todayLocalDate').and.returnValue(TODAY);

        const created = TestBed.createComponent(StatsInsightsPage);
        created.detectChanges();
        return created;
    };
    const host = (f: ComponentFixture<StatsInsightsPage>): HTMLElement =>
        f.nativeElement as HTMLElement;

    const controls = (f: ComponentFixture<StatsInsightsPage>): StatsInsightsControls =>
        f.debugElement.query(By.directive(StatsInsightsControls)).componentInstance;

    const dateRange = (f: ComponentFixture<StatsInsightsPage>): StatsDateRange =>
        f.debugElement.query(By.directive(StatsDateRange)).componentInstance;

    /** Edita el rango por la vía del usuario, sin apretar el botón. */
    const editRange = (f: ComponentFixture<StatsInsightsPage>, range: LocalDateRange): void => {
        dateRange(f).rangeChange.emit(range);
        f.detectChanges();
    };

    const cardEl = (f: ComponentFixture<StatsInsightsPage>): HTMLElement =>
        f.debugElement.query(By.directive(StatsInsightsCard)).nativeElement as HTMLElement;

    const cardCount = (f: ComponentFixture<StatsInsightsPage>): number =>
        f.debugElement.queryAll(By.directive(StatsInsightsCard)).length;

    const calledSections = (): StatsInsightsSection[] =>
        (Object.keys(getterBySection) as StatsInsightsSection[]).filter((section) =>
            service[getterBySection[section]].calls.any(),
        );

    const resetCalls = (): void => Object.values(service).forEach((spy) => spy.calls.reset());

    /**
     * El recorrido completo del usuario: editar el rango, elegir métrica y apretar
     * el botón. Sin `range` se usa el rango semilla del widget.
     */
    const run = (
        f: ComponentFixture<StatsInsightsPage>,
        section: StatsInsightsSection,
        range?: LocalDateRange,
    ): void => {
        if (range) editRange(f, range);
        controls(f).metricControl.setValue(section);
        f.detectChanges();
        (host(f).querySelector('[data-test="run-charts"]') as HTMLButtonElement).click();
        f.detectChanges();
    };

    beforeEach(async () => {
        service = buildService();
        fixture = await createFixture(service);
    });

    describe('the chain on the page (AC-014)', () => {
        it('renders the controls widget, not a bare date range', () => {
            expect(host(fixture).querySelector('app-stats-insights-controls')).not.toBeNull();
            expect(host(fixture).querySelector('app-stats-date-range'))
                .withContext('el rango va dentro de la cadena')
                .not.toBeNull();
        });

        it('offers a way back to the dashboard (FR-002)', () => {
            const link = host(fixture).querySelector('app-text-link') as HTMLElement;

            expect(link).not.toBeNull();
            expect(link.textContent).toContain('Volver a Mis Estadísticas');
        });

        it('starts with the run button disabled and no card', () => {
            const button = host(fixture).querySelector(
                '[data-test="run-charts"]',
            ) as HTMLButtonElement;

            expect(button.disabled).toBe(true);
            expect(cardCount(fixture)).withContext('AC-013: sin métrica, sin card').toBe(0);
        });
    });

    describe('nothing is requested until "Ver gráficas" (FR-023, AC-002)', () => {
        it('issues no request on entry', () => {
            expect(calledSections()).toEqual([]);
        });

        it('issues no request when only a metric is picked', () => {
            controls(fixture).metricControl.setValue('calories');
            fixture.detectChanges();

            expect(calledSections()).toEqual([]);
            expect(cardCount(fixture)).toBe(0);
        });

        it('issues no request when only a date is edited', () => {
            editRange(fixture, RANGE);

            expect(calledSections()).withContext('cambiar una fecha no consulta').toEqual([]);
        });

        it('seeds the controls with the last 30 days without querying them', () => {
            expect(dateRange(fixture).from()).toBe(SEED_RANGE.from);
            expect(dateRange(fixture).to()).toBe(SEED_RANGE.to);
            expect(calledSections()).toEqual([]);
        });
    });

    describe('running a section (AC-013)', () => {
        it('queries exactly one section and renders exactly one card', () => {
            run(fixture, 'calories', RANGE);

            expect(calledSections()).toEqual(['calories']);
            expect(service.getCaloriesWeekly).toHaveBeenCalledTimes(1);
            expect(cardCount(fixture)).toBe(1);
        });

        it('passes the chosen range and a timezone', () => {
            run(fixture, 'calories', RANGE);

            const input = service.getCaloriesWeekly.calls.mostRecent().args[0];
            expect(input.from).toBe(RANGE.from);
            expect(input.to).toBe(RANGE.to);
            expect(input.timezone).withContext('FR-004').toBeTruthy();
        });

        it('runs the seeded range when the user does not touch the dates', () => {
            run(fixture, 'calories');

            const input = service.getCaloriesWeekly.calls.mostRecent().args[0];
            expect(input.from).toBe(SEED_RANGE.from);
            expect(input.to).toBe(SEED_RANGE.to);
        });

        it('titles the card with the option label the select showed', () => {
            run(fixture, 'calories', RANGE);
            const option = host(fixture).querySelector('option[value="calories"]');

            expect(cardEl(fixture).textContent).toContain('Calorías semanales');
            expect(option?.textContent?.trim())
                .withContext('el select y el título leen de la misma opción')
                .toBe('Calorías semanales');
        });

        it('labels the card with the range that was run', () => {
            run(fixture, 'calories', RANGE);

            expect(cardEl(fixture).textContent).toContain('01/08/2026');
            expect(cardEl(fixture).textContent).toContain('30/08/2026');
        });

        it('does not label the card with a range the user has not run yet', () => {
            run(fixture, 'calories', RANGE);
            editRange(fixture, { from: '2026-05-01', to: '2026-05-31' });

            expect(cardEl(fixture).textContent).not.toContain('01/05/2026');
        });

        it('swaps the card when the metric changes, and queries the new one', () => {
            run(fixture, 'calories', RANGE);
            resetCalls();

            run(fixture, 'oneRm', RANGE);

            expect(calledSections()).toEqual(['oneRm']);
            expect(cardCount(fixture)).toBe(1);
            expect(cardEl(fixture).textContent).toContain('1RM semanal por ejercicio');
            expect(cardEl(fixture).textContent)
                .withContext('la card anterior no sobrevive al cambio (AC-013)')
                .not.toContain('Calorías semanales');
        });

        it('refetches the same section on a second press', () => {
            run(fixture, 'calories', RANGE);
            resetCalls();

            run(fixture, 'calories', RANGE);

            expect(service.getCaloriesWeekly).toHaveBeenCalledTimes(1);
            expect(calledSections()).toEqual(['calories']);
        });

        it('keeps volume on a single card with its two charts', () => {
            run(fixture, 'volume', RANGE);

            expect(cardCount(fixture)).toBe(1);
            expect(host(fixture).querySelectorAll('highcharts-chart').length).toBe(2);
        });
    });

    describe('refetch keeps the chart on screen (AC-005)', () => {
        it('shows a header spinner and no skeleton while the same section reloads', () => {
            // La primera corrida resuelve, así que hay chart en pantalla. La
            // segunda queda en vuelo: ese es el caso que distingue el spinner en
            // el header del esqueleto.
            run(fixture, 'calories', RANGE);
            const card = cardEl(fixture);
            expect(card.querySelector('highcharts-chart')).not.toBeNull();
            expect(card.querySelector('[aria-busy="true"]')).toBeNull();

            service.getCaloriesWeekly.and.returnValue(
                new Subject<CaloriesWeekVM[]>() as Observable<CaloriesWeekVM[]>,
            );
            run(fixture, 'calories', RANGE);

            expect(card.querySelector('app-loading'))
                .withContext('spinner en el header')
                .not.toBeNull();
            expect(card.querySelector('highcharts-chart'))
                .withContext('el chart anterior sigue en pantalla')
                .not.toBeNull();
            expect(card.querySelector('[aria-busy="true"]'))
                .withContext('y sin esqueleto')
                .toBeNull();
        });

        it('shows the skeleton on a first load, before any data exists', () => {
            service.getCaloriesWeekly.and.returnValue(
                new Subject<CaloriesWeekVM[]>() as Observable<CaloriesWeekVM[]>,
            );

            run(fixture, 'calories', RANGE);

            expect(cardEl(fixture).querySelector('[aria-busy="true"]'))
                .withContext('primera carga: esqueleto')
                .not.toBeNull();
        });
    });

    describe('extras projected into the card', () => {
        it('states that routine calories are not calculated by the server (FR-015)', () => {
            run(fixture, 'calories', RANGE);

            expect(cardEl(fixture).textContent).toContain('rutina');
            expect(cardEl(fixture).textContent).toContain('sesiones extra');
        });

        it('renders the forgotten-muscles list (FR-016)', () => {
            run(fixture, 'forgottenMuscles', RANGE);

            expect(cardEl(fixture).textContent).toContain('Piernas');
            expect(cardEl(fixture).textContent).toContain('Nunca');
        });

        it('renders the trend list (FR-017)', () => {
            run(fixture, 'exerciseTrend', RANGE);

            expect(cardEl(fixture).textContent).toContain('Sentadilla');
            expect(cardEl(fixture).textContent)
                .withContext('INSUFFICIENT no se muestra como 0%')
                .toContain('Sin datos suficientes');
        });

        it('projects no extras for a section that has none', () => {
            run(fixture, 'oneRm', RANGE);

            expect(cardEl(fixture).textContent).not.toContain('sesiones extra');
        });
    });

    describe('errors (FR-010, FR-011)', () => {
        it('raises one global notification when the run section fails', async () => {
            service.getCaloriesWeekly.and.returnValue(
                throwError(() => new Error('Rango rechazado por el servidor')),
            );
            const failing = await createFixture(service);
            run(failing, 'calories', RANGE);

            expect(host(failing).querySelectorAll('app-notification').length).toBe(1);
            expect(host(failing).textContent).toContain('Rango rechazado por el servidor');
        });

        it('shows the error card with a retry, and no other section is affected', async () => {
            service.getVolumeTotalWeekly.and.returnValue(
                throwError(() => new Error('Falla solo el volumen total')),
            );
            const failing = await createFixture(service);
            run(failing, 'volumeTotal', RANGE);

            expect(host(failing).querySelectorAll('[role="alert"]').length).toBe(1);
            expect(host(failing).querySelectorAll('app-stats-section').length).toBe(1);
            expect(calledSections()).toEqual(['volumeTotal']);
        });

        it('retries a single section with the range it was run with (FR-011)', async () => {
            service.getForgottenMuscles.and.returnValue(
                throwError(() => new Error('Músculos olvidados no disponible')),
            );
            const failing = await createFixture(service);
            run(failing, 'forgottenMuscles', RANGE);
            resetCalls();

            service.getForgottenMuscles.and.returnValue(of(forgotten));
            failing.componentInstance.retry('forgottenMuscles');
            failing.detectChanges();

            expect(service.getForgottenMuscles).toHaveBeenCalledTimes(1);
            const input = service.getForgottenMuscles.calls.mostRecent().args[0];
            expect(input.from).toBe(RANGE.from);
            expect(input.to).toBe(RANGE.to);
            expect(host(failing).textContent).toContain('Piernas');
        });
    });
});
