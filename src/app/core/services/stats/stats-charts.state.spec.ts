import { TestBed } from '@angular/core/testing';
import { Observable, Subject, of, throwError } from 'rxjs';
import { STATS_CHARTS_SECTIONS, StatsChartsState } from './stats-charts.state';
import { StatsChartsService } from './stats-charts.service';
import { DateService } from '../date.service';
import {
    CaloriesWeekVM,
    ExerciseTrendVM,
    ForgottenMuscleVM,
    OneRmExerciseVM,
    StatsChartsSection,
    VolumeTotalWeekVM,
    VolumeWeekVM,
} from '../../../shared/interfaces/stats-charts.interface';

type GetterName =
    | 'getOneRmWeekly'
    | 'getVolumeWeekly'
    | 'getVolumeTotalWeekly'
    | 'getCaloriesWeekly'
    | 'getForgottenMuscles'
    | 'getExerciseTrend';

describe('StatsChartsState (TEST-018, TEST-019)', () => {
    const TIMEZONE = 'America/Argentina/Buenos_Aires';
    const TODAY = '2026-09-01';
    // 30 días hacia atrás desde el 2026-09-01, inclusivo.
    const INITIAL_RANGE = { from: '2026-08-03', to: '2026-09-01' };
    const OTHER_RANGE = { from: '2026-07-01', to: '2026-07-31' };

    let state: StatsChartsState;
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

    const getterBySection: Record<StatsChartsSection, GetterName> = {
        oneRm: 'getOneRmWeekly',
        volume: 'getVolumeWeekly',
        volumeTotal: 'getVolumeTotalWeekly',
        calories: 'getCaloriesWeekly',
        forgottenMuscles: 'getForgottenMuscles',
        exerciseTrend: 'getExerciseTrend',
    };

    const inputCalls = (name: GetterName): unknown =>
        service[name].calls.mostRecent()?.args[0] as unknown;

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
                StatsChartsState,
                { provide: StatsChartsService, useValue: service },
                DateService,
            ],
        });

        dateSvc = TestBed.inject(DateService);
        // Se fija "hoy" para que la aritmética real de lastNDays se ejercite;
        // sólo se stubea el reloj, no el cálculo.
        spyOn(dateSvc, 'todayLocalDate').and.returnValue(TODAY);
        spyOn(dateSvc, 'getUserTimezone').and.returnValue(TIMEZONE);

        state = TestBed.inject(StatsChartsState);
    });

    describe('initial state (TEST-018)', () => {
        it('starts on the last 30 days ending today', () => {
            expect(state.range()).toEqual(INITIAL_RANGE);
            // El reloj está stubeado, no el cálculo: `lastNDays(30)` corrió de verdad.
            expect(dateSvc.todayLocalDate).toHaveBeenCalledWith(TIMEZONE);
            expect(state.timezone()).toBe(TIMEZONE);
        });

        it('starts with empty, idle entries for every section', () => {
            STATS_CHARTS_SECTIONS.forEach((section) => {
                expect(state.entry(section)()).toEqual({
                    data: null,
                    loading: false,
                    error: null,
                });
            });
        });

        it('fetches nothing until load() is called', () => {
            STATS_CHARTS_SECTIONS.forEach((section) => {
                expect(service[getterBySection[section]]).not.toHaveBeenCalled();
            });
        });
    });

    describe('load (TEST-018)', () => {
        it('fetches all six sections with the initial input', () => {
            state.load();

            STATS_CHARTS_SECTIONS.forEach((section) => {
                const name = getterBySection[section];
                expect(service[name]).toHaveBeenCalledTimes(1);
                expect(inputCalls(name)).toEqual({
                    ...INITIAL_RANGE,
                    timezone: TIMEZONE,
                });
            });
        });

        it('populates data and clears loading for every section', () => {
            service.getOneRmWeekly.and.returnValue(of(emptyVm.oneRm));
            service.getVolumeWeekly.and.returnValue(of(emptyVm.volume));
            service.getVolumeTotalWeekly.and.returnValue(of(emptyVm.volumeTotal));
            service.getCaloriesWeekly.and.returnValue(of(emptyVm.calories));
            service.getForgottenMuscles.and.returnValue(of(emptyVm.forgottenMuscles));
            service.getExerciseTrend.and.returnValue(of(emptyVm.exerciseTrend));

            state.load();

            STATS_CHARTS_SECTIONS.forEach((section) => {
                expect(state.entry(section)().data).toEqual(emptyVm[section]);
                expect(state.entry(section)().loading).toBe(false);
                expect(state.entry(section)().error).toBeNull();
            });
        });
    });

    describe('applyRange (TEST-018)', () => {
        it('refetches all six with the new input and updates the range signal', () => {
            state.load();
            STATS_CHARTS_SECTIONS.forEach((section) =>
                service[getterBySection[section]].calls.reset(),
            );

            state.applyRange(OTHER_RANGE);

            expect(state.range()).toEqual(OTHER_RANGE);
            STATS_CHARTS_SECTIONS.forEach((section) => {
                const name = getterBySection[section];
                expect(service[name]).toHaveBeenCalledTimes(1);
                expect(inputCalls(name)).toEqual({ ...OTHER_RANGE, timezone: TIMEZONE });
            });
        });
    });

    describe('per-section isolation (TEST-018)', () => {
        it('a failing section sets only its own error and leaves the rest intact', () => {
            const volumes = [{ weekKey: '2026-W32' }] as unknown as VolumeWeekVM[];
            service.getVolumeWeekly.and.returnValue(of(volumes));
            service.getVolumeTotalWeekly.and.returnValue(throwError(() => new Error('boom')));

            state.load();

            expect(state.entry('volumeTotal')().error).toBe('boom');
            expect(state.entry('volumeTotal')().data).toBeNull();
            expect(state.entry('volumeTotal')().loading).toBe(false);
            expect(state.entry('volume')().data).toEqual(volumes);
            expect(state.entry('volume')().error).toBeNull();
            expect(state.entry('oneRm')().error).toBeNull();
        });

        it('surfaces a non-Error rejection as a readable message', () => {
            service.getOneRmWeekly.and.returnValue(
                throwError(() => ({ message: 'Rango inválido' })),
            );

            state.load();

            expect(state.entry('oneRm')().error).toBe('Rango inválido');
        });

        it('shows loading while in flight and clears it on error', () => {
            const pending = new Subject<VolumeTotalWeekVM[]>();
            service.getVolumeTotalWeekly.and.returnValue(
                pending as Observable<VolumeTotalWeekVM[]>,
            );

            state.load();

            expect(state.entry('volumeTotal')().loading).toBe(true);

            pending.error(new Error('boom'));

            expect(state.entry('volumeTotal')().loading).toBe(false);
        });
    });

    describe('retry (TEST-018)', () => {
        it('re-runs a single section with the current range', () => {
            state.load();
            service.getVolumeWeekly.and.returnValue(throwError(() => new Error('boom')));
            state.applyRange(OTHER_RANGE);
            expect(state.entry('volume')().error).toBe('boom');

            STATS_CHARTS_SECTIONS.forEach((section) =>
                service[getterBySection[section]].calls.reset(),
            );
            service.getVolumeWeekly.and.returnValue(of(emptyVm.volume));

            state.retry('volume');

            expect(service.getVolumeWeekly).toHaveBeenCalledTimes(1);
            expect(inputCalls('getVolumeWeekly')).toEqual({ ...OTHER_RANGE, timezone: TIMEZONE });
            STATS_CHARTS_SECTIONS.forEach((section) => {
                if (section === 'volume') return;
                expect(service[getterBySection[section]]).not.toHaveBeenCalled();
            });
        });

        it('clears the previous error and stores the fresh data', () => {
            service.getOneRmWeekly.and.returnValue(throwError(() => new Error('offline')));
            state.load();
            expect(state.entry('oneRm')().error).toBe('offline');

            service.getOneRmWeekly.and.returnValue(of(emptyVm.oneRm));
            state.retry('oneRm');

            expect(state.entry('oneRm')().error).toBeNull();
            expect(state.entry('oneRm')().data).toEqual(emptyVm.oneRm);
        });
    });

    describe('out-of-order protection (TEST-019)', () => {
        it('drops a late response for a superseded range', () => {
            const first = new Subject<OneRmExerciseVM[]>();
            const second = new Subject<OneRmExerciseVM[]>();
            const firstPayload = [{ exerciseId: 'stale' }] as unknown as OneRmExerciseVM[];
            const secondPayload = [{ exerciseId: 'fresh' }] as unknown as OneRmExerciseVM[];

            service.getOneRmWeekly.and.returnValues(
                first as Observable<OneRmExerciseVM[]>,
                second as Observable<OneRmExerciseVM[]>,
            );

            state.load();
            expect(state.entry('oneRm')().loading).toBe(true);

            state.applyRange(OTHER_RANGE);

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

            state.load();
            expect(first.observers.length).toBe(1);

            state.applyRange(OTHER_RANGE);

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

            state.load();
            state.applyRange(OTHER_RANGE);

            first.error(new Error('stale boom'));

            expect(state.entry('oneRm')().error).toBeNull();
        });

        it('keeps the other five sections on the previous range data while one is in flight', () => {
            const pending = new Subject<VolumeWeekVM[]>();
            service.getVolumeWeekly.and.returnValues(
                of(emptyVm.volume) as Observable<VolumeWeekVM[]>,
                pending as Observable<VolumeWeekVM[]>,
            );

            state.load();
            state.applyRange(OTHER_RANGE);

            // `volume` quedó en vuelo: conserva el dato viejo y marca loading,
            // que es lo que la página deriva como `refreshing`.
            expect(state.entry('volume')().loading).toBe(true);
            expect(state.entry('volume')().data).toEqual(emptyVm.volume);
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

            state.load();

            const data = state.data('oneRm')();
            expect(data).toEqual(weights);
            // Narrowing usable sin cast en la página: cada sección conoce su tipo.
            expect(data?.[0].name).toBe('Press banca');
        });

        it('keeps a previous payload while the section refetches', () => {
            service.getForgottenMuscles.and.returnValue(of(emptyVm.forgottenMuscles));
            state.load();

            service.getForgottenMuscles.and.returnValue(new Subject<ForgottenMuscleVM[]>());
            state.applyRange(OTHER_RANGE);

            expect(state.entry('forgottenMuscles')().loading).toBe(true);
            expect(state.data('forgottenMuscles')()).toEqual(emptyVm.forgottenMuscles);
        });
    });
});
