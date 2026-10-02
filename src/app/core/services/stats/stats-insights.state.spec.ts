import { TestBed } from '@angular/core/testing';
import { Observable, Subject, of, throwError } from 'rxjs';
import { STATS_INSIGHTS_SECTIONS, StatsInsightsState } from './stats-insights.state';
import { StatsInsightsService } from './stats-insights.service';
import { DateService } from '../date.service';
import {
    CaloriesWeekVM,
    ExerciseTrendVM,
    ForgottenMuscleVM,
    OneRmExerciseVM,
    StatsInsightsSection,
    VolumeTotalWeekVM,
    VolumeWeekVM,
} from '../../../shared/interfaces/stats-insights.interface';

type GetterName =
    | 'getOneRmWeekly'
    | 'getVolumeWeekly'
    | 'getVolumeTotalWeekly'
    | 'getCaloriesWeekly'
    | 'getForgottenMuscles'
    | 'getExerciseTrend';

describe('StatsInsightsState (TEST-018, TEST-019)', () => {
    const TIMEZONE = 'America/Argentina/Buenos_Aires';
    const TODAY = '2026-09-01';
    // 30 días hacia atrás desde el 2026-09-01, inclusivo.
    const DEFAULT_RANGE = { from: '2026-08-03', to: '2026-09-01' };
    const OTHER_RANGE = { from: '2026-07-01', to: '2026-07-31' };
    const THIRD_RANGE = { from: '2026-05-01', to: '2026-05-31' };

    let state: StatsInsightsState;
    let dateSvc: DateService;
    let service: Record<GetterName, jasmine.Spy>;

    // Sin anotación de tipo: el acceso por propiedad debe ser directo, y
    // `emptyVm[section]` sigue resolviendo con la unión de claves.
    const emptyVm = {
        oneRm: [] as OneRmExerciseVM[],
        volume: [] as VolumeWeekVM[],
        volumeTotal: [] as VolumeTotalWeekVM[],
        calories: [] as CaloriesWeekVM[],
        forgottenMuscles: [] as ForgottenMuscleVM[],
        exerciseTrend: [] as ExerciseTrendVM[],
    };

    const getterBySection: Record<StatsInsightsSection, GetterName> = {
        oneRm: 'getOneRmWeekly',
        volume: 'getVolumeWeekly',
        volumeTotal: 'getVolumeTotalWeekly',
        calories: 'getCaloriesWeekly',
        forgottenMuscles: 'getForgottenMuscles',
        exerciseTrend: 'getExerciseTrend',
    };

    const inputCalls = (name: GetterName): unknown =>
        service[name].calls.mostRecent()?.args[0] as unknown;

    /** Los getters que fueron llamados, contados. */
    const callsFor = (): StatsInsightsSection[] =>
        STATS_INSIGHTS_SECTIONS.filter((section) => service[getterBySection[section]].calls.any());

    const resetCalls = (): void =>
        STATS_INSIGHTS_SECTIONS.forEach((section) =>
            service[getterBySection[section]].calls.reset(),
        );

    beforeEach(() => {
        service = {
            getOneRmWeekly: jasmine.createSpy('getOneRmWeekly').and.returnValue(of([])),
            getVolumeWeekly: jasmine.createSpy('getVolumeWeekly').and.returnValue(of([])),
            getVolumeTotalWeekly: jasmine.createSpy('getVolumeTotalWeekly').and.returnValue(of([])),
            getCaloriesWeekly: jasmine.createSpy('getCaloriesWeekly').and.returnValue(of([])),
            getForgottenMuscles: jasmine.createSpy('getForgottenMuscles').and.returnValue(of([])),
            getExerciseTrend: jasmine.createSpy('getExerciseTrend').and.returnValue(of([])),
        };

        TestBed.configureTestingModule({
            providers: [
                StatsInsightsState,
                { provide: StatsInsightsService, useValue: service },
                DateService,
            ],
        });

        dateSvc = TestBed.inject(DateService);
        // Se fija "hoy" para que la aritmética real de lastNDays se ejercite;
        // sólo se stubea el reloj, no el cálculo.
        spyOn(dateSvc, 'todayLocalDate').and.returnValue(TODAY);
        spyOn(dateSvc, 'getUserTimezone').and.returnValue(TIMEZONE);

        state = TestBed.inject(StatsInsightsState);
    });

    describe('initial state (TEST-018, FR-023)', () => {
        it('seeds the default range on the last 30 days ending today', () => {
            expect(state.range()).toEqual(DEFAULT_RANGE);
            // El reloj está stubeado, no el cálculo: `lastNDays(30)` corrió de verdad.
            expect(dateSvc.todayLocalDate).toHaveBeenCalledWith(TIMEZONE);
            expect(state.timezone()).toBe(TIMEZONE);
        });

        it('constructs with empty, idle entries for every section', () => {
            STATS_INSIGHTS_SECTIONS.forEach((section) => {
                expect(state.entry(section)()).toEqual({
                    data: null,
                    loading: false,
                    error: null,
                });
            });
        });

        it('fires zero getters just by being constructed', () => {
            expect(callsFor()).withContext('entrar a la ruta no consulta (FR-023)').toEqual([]);
        });

        it('has no applied range for any section before the first run', () => {
            STATS_INSIGHTS_SECTIONS.forEach((section) => {
                expect(state.appliedRange(section)()).toBeNull();
            });
        });
    });

    describe('run (TEST-018, FR-023)', () => {
        it('fetches only the requested section, with the range and timezone', () => {
            state.run('volumeTotal', DEFAULT_RANGE);

            expect(service.getVolumeTotalWeekly).toHaveBeenCalledTimes(1);
            expect(inputCalls('getVolumeTotalWeekly')).toEqual({
                ...DEFAULT_RANGE,
                timezone: TIMEZONE,
            });
            expect(callsFor()).withContext('las otras cinco no se tocan').toEqual(['volumeTotal']);
        });

        it('does not disturb the five sections it did not request', () => {
            state.run('oneRm', DEFAULT_RANGE);

            STATS_INSIGHTS_SECTIONS.filter((section) => section !== 'oneRm').forEach((section) => {
                expect(state.entry(section)()).toEqual({ data: null, loading: false, error: null });
            });
        });

        it('populates data and clears loading for the run section', () => {
            service.getOneRmWeekly.and.returnValue(of(emptyVm.oneRm));

            state.run('oneRm', DEFAULT_RANGE);

            expect(state.entry('oneRm')().data).toEqual(emptyVm.oneRm);
            expect(state.entry('oneRm')().loading).toBe(false);
            expect(state.entry('oneRm')().error).toBeNull();
        });

        it('records the applied range for the section it ran', () => {
            state.run('calories', OTHER_RANGE);

            expect(state.appliedRange('calories')()).toEqual(OTHER_RANGE);
            expect(state.appliedRange('oneRm')()).toBeNull();
        });

        it('leaves the seed range alone: the default is not the applied range', () => {
            state.run('calories', OTHER_RANGE);

            expect(state.range())
                .withContext('el seed no se mueve con un run')
                .toEqual(DEFAULT_RANGE);
            expect(state.appliedRange('calories')()).toEqual(OTHER_RANGE);
        });

        it('keeps a per-section applied range when another section runs', () => {
            state.run('oneRm', DEFAULT_RANGE);
            state.run('calories', OTHER_RANGE);

            expect(state.appliedRange('oneRm')()).toEqual(DEFAULT_RANGE);
            expect(state.appliedRange('calories')()).toEqual(OTHER_RANGE);
        });

        it('refetches only the same section when run twice', () => {
            state.run('oneRm', DEFAULT_RANGE);
            resetCalls();

            state.run('oneRm', OTHER_RANGE);

            expect(callsFor()).toEqual(['oneRm']);
            expect(service.getOneRmWeekly).toHaveBeenCalledTimes(1);
            expect(inputCalls('getOneRmWeekly')).toEqual({ ...OTHER_RANGE, timezone: TIMEZONE });
        });
    });

    describe('per-section isolation (TEST-018)', () => {
        it('a failing section sets only its own error and leaves the rest intact', () => {
            const volumes = [{ weekKey: '2026-W32' }] as unknown as VolumeWeekVM[];
            service.getVolumeWeekly.and.returnValue(of(volumes));
            service.getVolumeTotalWeekly.and.returnValue(throwError(() => new Error('boom')));

            state.run('volumeTotal', OTHER_RANGE);

            expect(state.entry('volumeTotal')().error).toBe('boom');
            expect(state.entry('volumeTotal')().data).toBeNull();
            expect(state.entry('volumeTotal')().loading).toBe(false);

            state.run('volume', OTHER_RANGE);
            expect(state.entry('volume')().data).toEqual(volumes);
            expect(state.entry('volume')().error).toBeNull();
        });

        it('surfaces a non-Error rejection as a readable message', () => {
            service.getOneRmWeekly.and.returnValue(
                throwError(() => ({ message: 'Rango inválido' })),
            );

            state.run('oneRm', DEFAULT_RANGE);

            expect(state.entry('oneRm')().error).toBe('Rango inválido');
        });

        it('shows loading while in flight and clears it on error', () => {
            const pending = new Subject<VolumeTotalWeekVM[]>();
            service.getVolumeTotalWeekly.and.returnValue(
                pending as Observable<VolumeTotalWeekVM[]>,
            );

            state.run('volumeTotal', DEFAULT_RANGE);
            expect(state.entry('volumeTotal')().loading).toBe(true);

            pending.error(new Error('boom'));
            expect(state.entry('volumeTotal')().loading).toBe(false);
        });
    });

    describe('retry (TEST-018, FR-011)', () => {
        it('re-runs a single section with its own applied range', () => {
            service.getVolumeWeekly.and.returnValue(throwError(() => new Error('boom')));
            state.run('volume', OTHER_RANGE);
            expect(state.entry('volume')().error).toBe('boom');
            resetCalls();

            service.getVolumeWeekly.and.returnValue(of(emptyVm.volume));
            state.retry('volume');

            expect(service.getVolumeWeekly).toHaveBeenCalledTimes(1);
            expect(inputCalls('getVolumeWeekly')).toEqual({ ...OTHER_RANGE, timezone: TIMEZONE });
            expect(callsFor()).withContext('reintentar no dispara las otras').toEqual(['volume']);
        });

        it('re-runs with the range that section was last run with, not the last run overall', () => {
            state.run('volume', DEFAULT_RANGE);
            state.run('oneRm', THIRD_RANGE);
            resetCalls();

            state.retry('volume');

            expect(inputCalls('getVolumeWeekly')).toEqual({ ...DEFAULT_RANGE, timezone: TIMEZONE });
        });

        it('clears the previous error and stores the fresh data', () => {
            service.getOneRmWeekly.and.returnValue(throwError(() => new Error('offline')));
            state.run('oneRm', DEFAULT_RANGE);
            expect(state.entry('oneRm')().error).toBe('offline');

            service.getOneRmWeekly.and.returnValue(of(emptyVm.oneRm));
            state.retry('oneRm');

            expect(state.entry('oneRm')().error).toBeNull();
            expect(state.entry('oneRm')().data).toEqual(emptyVm.oneRm);
        });

        it('does nothing for a section that was never run', () => {
            state.retry('calories');

            expect(callsFor()).toEqual([]);
        });
    });

    describe('out-of-order protection (TEST-019, FR-023)', () => {
        it('drops a late response for a superseded range', () => {
            const first = new Subject<OneRmExerciseVM[]>();
            const second = new Subject<OneRmExerciseVM[]>();
            const firstPayload = [{ exerciseId: 'stale' }] as unknown as OneRmExerciseVM[];
            const secondPayload = [{ exerciseId: 'fresh' }] as unknown as OneRmExerciseVM[];

            service.getOneRmWeekly.and.returnValues(
                first as Observable<OneRmExerciseVM[]>,
                second as Observable<OneRmExerciseVM[]>,
            );

            state.run('oneRm', DEFAULT_RANGE);
            expect(state.entry('oneRm')().loading).toBe(true);

            state.run('oneRm', OTHER_RANGE);

            // La respuesta tardía del rango viejo no debe tocar `data`.
            first.next(firstPayload);
            expect(state.entry('oneRm')().data).toBeNull();

            second.next(secondPayload);
            expect(state.entry('oneRm')().data).toEqual(secondPayload);
        });

        it('actually unsubscribes the superseded request', () => {
            const first = new Subject<OneRmExerciseVM[]>();
            const second = new Subject<OneRmExerciseVM[]>();
            service.getOneRmWeekly.and.returnValues(
                first as Observable<OneRmExerciseVM[]>,
                second as Observable<OneRmExerciseVM[]>,
            );

            state.run('oneRm', DEFAULT_RANGE);
            expect(first.observers.length).toBe(1);

            state.run('oneRm', OTHER_RANGE);

            expect(first.observers.length).toBe(0);
            expect(second.observers.length).toBe(1);
        });

        it('ignores an error arriving from a superseded request', () => {
            const first = new Subject<OneRmExerciseVM[]>();
            const second = new Subject<OneRmExerciseVM[]>();
            service.getOneRmWeekly.and.returnValues(
                first as Observable<OneRmExerciseVM[]>,
                second as Observable<OneRmExerciseVM[]>,
            );

            state.run('oneRm', DEFAULT_RANGE);
            state.run('oneRm', OTHER_RANGE);

            first.error(new Error('stale boom'));

            expect(state.entry('oneRm')().error).toBeNull();
        });

        it('does not cancel a section that is not part of the second run', () => {
            const oneRm = new Subject<OneRmExerciseVM[]>();
            const volume = new Subject<VolumeWeekVM[]>();
            service.getOneRmWeekly.and.returnValue(oneRm as Observable<OneRmExerciseVM[]>);
            service.getVolumeWeekly.and.returnValue(volume as Observable<VolumeWeekVM[]>);

            state.run('oneRm', DEFAULT_RANGE);
            state.run('volume', DEFAULT_RANGE);
            expect(oneRm.observers.length).toBe(1);

            state.run('volume', OTHER_RANGE);

            expect(oneRm.observers.length)
                .withContext('un subject por sección aísla la cancelación')
                .toBe(1);
            expect(volume.observers.length).toBe(1);
        });

        it('keeps the previous data on screen while the same section refetches', () => {
            service.getVolumeWeekly.and.returnValues(
                of(emptyVm.volume) as Observable<VolumeWeekVM[]>,
                new Subject<VolumeWeekVM[]>(),
            );

            state.run('volume', DEFAULT_RANGE);
            state.run('volume', OTHER_RANGE);

            // Carga en vuelo con dato previo: es lo que la card deriva como
            // `refreshing` en vez de volver al esqueleto (AC-005).
            expect(state.entry('volume')().loading).toBe(true);
            expect(state.entry('volume')().data).toEqual(emptyVm.volume);
            expect(state.appliedRange('volume')()).toEqual(OTHER_RANGE);
        });
    });

    describe('data() (typed per-section accessor)', () => {
        it('returns null until the section resolves', () => {
            expect(state.data('oneRm')()).toBeNull();
        });

        it('returns the payload narrowed to the VM family of that section', () => {
            const weights = [
                { exerciseId: 'ex-1', name: 'Press banca', category: 'chest', weeks: [] },
            ] as unknown as OneRmExerciseVM[];
            service.getOneRmWeekly.and.returnValue(of(weights));

            state.run('oneRm', DEFAULT_RANGE);

            const data = state.data('oneRm')();
            expect(data).toEqual(weights);
            // Narrowing usable sin cast en la página: cada sección conoce su tipo.
            expect(data?.[0].name).toBe('Press banca');
        });

        it('keeps a previous payload while the section refetches', () => {
            service.getForgottenMuscles.and.returnValue(of(emptyVm.forgottenMuscles));
            state.run('forgottenMuscles', DEFAULT_RANGE);

            service.getForgottenMuscles.and.returnValue(new Subject<ForgottenMuscleVM[]>());
            state.run('forgottenMuscles', OTHER_RANGE);

            expect(state.entry('forgottenMuscles')().loading).toBe(true);
            expect(state.data('forgottenMuscles')()).toEqual(emptyVm.forgottenMuscles);
        });
    });
});
