import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError, type Observable } from 'rxjs';
import { provideHighcharts } from 'highcharts-angular';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { StatsDateRange } from '../../../shared/components/widgets/stats/stats-date-range/stats-date-range';
import { StatsChartsPage } from './stats-charts';
import { StatsChartsService } from '../../../core/services/stats/stats-charts.service';
import type {
    CaloriesWeekVM,
    ExerciseTrendVM,
    ForgottenMuscleVM,
    OneRmExerciseVM,
    VolumeTotalWeekVM,
    VolumeWeekVM,
} from '../../../shared/interfaces/stats-charts.interface';
import type { StatsCategory } from '../../../shared/interfaces/stats.interface';

interface ServiceStub {
    getOneRmWeekly: jasmine.Spy;
    getVolumeWeekly: jasmine.Spy;
    getVolumeTotalWeekly: jasmine.Spy;
    getCaloriesWeekly: jasmine.Spy;
    getForgottenMuscles: jasmine.Spy;
    getExerciseTrend: jasmine.Spy;
}

/**
 * TEST-021 (sdd/stats-charts/spec.md, FR-002, FR-011, FR-015, FR-020).
 *
 * La page es un orquestador delgado: no consulta, no persiste y no arma options
 * de Highcharts. Lo que se verifica acá es el contrato de la capa de arriba —
 * que dispare las seis secciones, que el rango novo las re-dispare, que un error
 * de una sola sección levante una notificación global sin tocar las otras, y que
 * la nota de `routineKcal` esté presente.
 *
 * `StatsChartsState` es real (es la lógica de la feature); el servicio va
 * mockeado, igual que en `stats.spec.ts`.
 */
describe('StatsChartsPage (TEST-021)', () => {
    let fixture: ComponentFixture<StatsChartsPage>;
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

    const createFixture = async (stub: ServiceStub): Promise<ComponentFixture<StatsChartsPage>> => {
        // Los escenarios de error necesitan su propia instancia del TestBed con
        // el servicio ya stubeado para fallar; sin reset, la segunda
        // configuración choca con la instancia anterior.
        TestBed.resetTestingModule();
        await TestBed.configureTestingModule({
            imports: [StatsChartsPage],
            providers: [
                provideHighcharts(),
                // `app-text-link` navega con `routerLink`, que necesita un
                // ActivatedRoute aunque el test no ejercite la navegación.
                provideRouter([]),
                { provide: StatsChartsService, useValue: stub },
            ],
        }).compileComponents();

        const created = TestBed.createComponent(StatsChartsPage);
        created.detectChanges();
        return created;
    };

    const rangeWidget = (f: ComponentFixture<StatsChartsPage>) =>
        f.debugElement.query(By.directive(StatsDateRange)).componentInstance as StatsDateRange;

    /** Los escenarios de error crean una segunda page sobre el mismo stub. */
    const resetCalls = () => Object.values(service).forEach((spy) => spy.calls.reset());

    beforeEach(async () => {
        service = buildService();
        fixture = await createFixture(service);
    });

    it('renders the date-range widget and the six sections', () => {
        const host = fixture.nativeElement as HTMLElement;

        expect(host.querySelector('app-stats-date-range')).withContext('FR-006').not.toBeNull();
        expect(host.querySelectorAll('app-stats-section').length).withContext('FR-020').toBe(6);
    });

    it('offers a way back to the dashboard (FR-002)', () => {
        const host = fixture.nativeElement as HTMLElement;
        const link = host.querySelector('app-text-link') as HTMLElement;

        expect(link).not.toBeNull();
        expect(link.textContent).toContain('Volver a Mis Estadísticas');
    });

    it('fires all six queries once on the initial load with the default range', () => {
        expect(service.getOneRmWeekly).toHaveBeenCalledTimes(1);
        expect(service.getVolumeWeekly).toHaveBeenCalledTimes(1);
        expect(service.getVolumeTotalWeekly).toHaveBeenCalledTimes(1);
        expect(service.getCaloriesWeekly).toHaveBeenCalledTimes(1);
        expect(service.getForgottenMuscles).toHaveBeenCalledTimes(1);
        expect(service.getExerciseTrend).toHaveBeenCalledTimes(1);

        const input = service.getCaloriesWeekly.calls.mostRecent().args[0];
        expect(input.timezone).withContext('FR-004').toBeTruthy();
        expect(input.from).toBeTruthy();
        expect(input.to).toBeTruthy();
    });

    it('refetches the six sections when the widget emits a new range (FR-008)', () => {
        rangeWidget(fixture).rangeChange.emit({ from: '2026-08-01', to: '2026-08-30' });
        fixture.detectChanges();

        expect(service.getCaloriesWeekly).toHaveBeenCalledTimes(2);
        expect(service.getVolumeTotalWeekly)
            .withContext('las seis, no una')
            .toHaveBeenCalledTimes(2);
        const input = service.getCaloriesWeekly.calls.mostRecent().args[0];
        expect(input.from).toBe('2026-08-01');
        expect(input.to).toBe('2026-08-30');
    });

    it('states that routine calories are not calculated by the server (FR-015)', () => {
        const host = fixture.nativeElement as HTMLElement;

        expect(host.textContent).toContain('rutina');
        expect(host.textContent).toContain('sesiones extra');
    });

    it('renders the two companion lists (FR-016, FR-017)', () => {
        const host = fixture.nativeElement as HTMLElement;

        expect(host.textContent).withContext('músculo olvidado').toContain('Piernas');
        expect(host.textContent).withContext('sin última fecha').toContain('Nunca');
        expect(host.textContent).withContext('ejercicio en tendencia').toContain('Sentadilla');
        expect(host.textContent)
            .withContext('INSUFFICIENT no se muestra como 0%')
            .toContain('Sin datos suficientes');
    });

    it('keeps the previous chart visible with a spinner while refetching (FR-009)', async () => {
        const pending = new Subject<VolumeTotalWeekVM[]>();
        service.getVolumeTotalWeekly.and.returnValue(pending as Observable<VolumeTotalWeekVM[]>);
        const host = fixture.nativeElement as HTMLElement;

        rangeWidget(fixture).rangeChange.emit({ from: '2026-08-01', to: '2026-08-30' });
        fixture.detectChanges();

        const sections = host.querySelectorAll('app-stats-section');
        const volumeTotalCard = sections[2] as HTMLElement;
        expect(volumeTotalCard.querySelector('app-loading')).not.toBeNull();
        expect(volumeTotalCard.querySelector('highcharts-chart')).not.toBeNull();
        expect(volumeTotalCard.querySelector('[aria-busy="true"]'))
            .withContext('sin skeleton')
            .toBeNull();
    });

    it('raises one global notification when a section fails (FR-011)', async () => {
        service.getCaloriesWeekly.and.returnValue(
            throwError(() => new Error('Rango rechazado por el servidor')),
        );
        const failing = await createFixture(service);
        failing.detectChanges();

        const host = failing.nativeElement as HTMLElement;
        expect(host.querySelectorAll('app-notification').length).toBe(1);
        expect(host.textContent).toContain('Rango rechazado por el servidor');
    });

    it('keeps the other five sections rendering when one fails (FR-010)', async () => {
        service.getVolumeTotalWeekly.and.returnValue(
            throwError(() => new Error('Falla solo el volumen total')),
        );
        const failing = await createFixture(service);
        failing.detectChanges();

        const host = failing.nativeElement as HTMLElement;
        const sections = host.querySelectorAll('app-stats-section');
        const errorCards = host.querySelectorAll('[role="alert"]');

        expect(errorCards.length).withContext('una sola card de error').toBe(1);
        expect(sections.length).toBe(6);
        expect(host.textContent)
            .withContext('las otras cinco siguen con contenido')
            .toContain('Press banca');
    });

    it('retries a single section with the current range (FR-011)', async () => {
        service.getForgottenMuscles.and.returnValue(
            throwError(() => new Error('Músculos olvidados no disponible')),
        );
        const failing = await createFixture(service);
        failing.detectChanges();
        resetCalls();

        failing.componentInstance.retry('forgottenMuscles');

        expect(service.getForgottenMuscles).toHaveBeenCalledTimes(1);
        expect(service.getOneRmWeekly)
            .withContext('las otras cinco no se re-disparan')
            .not.toHaveBeenCalled();

        service.getForgottenMuscles.and.returnValue(of(forgotten));
        failing.componentInstance.retry('forgottenMuscles');
        failing.detectChanges();

        expect((failing.nativeElement as HTMLElement).textContent).toContain('Piernas');
    });
});
