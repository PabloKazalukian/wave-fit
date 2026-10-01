import { TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';
import { Observable, of, throwError } from 'rxjs';
import { StatsChartsService } from './stats-charts.service';
import { AuthService } from '../auth/auth.service';
import {
    CaloriesWeekAPI,
    ExerciseTrendAPI,
    ForgottenMuscleAPI,
    OneRmExerciseAPI,
    VolumeTotalWeekAPI,
    VolumeWeekAPI,
} from '../../../shared/interfaces/api/stats-charts-api.interface';
import type { StatsChartsQueryInput } from '../../../shared/interfaces/stats-charts.interface';

type Observed<T> = T extends Observable<infer U> ? U : never;

describe('StatsChartsService (TEST-008)', () => {
    let service: StatsChartsService;
    let apollo: { query: jasmine.Spy };

    const input: StatsChartsQueryInput = {
        from: '2026-08-02',
        to: '2026-09-01',
        timezone: 'America/Argentina/Buenos_Aires',
    };

    const oneRmApi: OneRmExerciseAPI[] = [
        {
            exerciseId: 'ex-1',
            name: 'Press banca',
            category: 'CHEST',
            weeks: [
                {
                    weekKey: '2026-W32',
                    best1RM: 100.04,
                    weightUsed: 80.04,
                    reps: 5,
                    participated: true,
                },
            ],
        },
    ];

    const volumeApi: VolumeWeekAPI[] = [
        {
            weekKey: '2026-W32',
            exercises: [
                { exerciseId: 'ex-1', name: 'Press banca', category: 'CHEST', volume: 400.04 },
            ],
            muscles: [{ muscle: 'chest', sets: 4, volume: 400.04 }],
        },
    ];

    const volumeTotalApi: VolumeTotalWeekAPI[] = [
        { weekKey: '2026-W32', totalVolume: 400.04, deltaPct: -35.6, possibleDeload: true },
    ];

    const caloriesApi: CaloriesWeekAPI[] = [
        {
            weekKey: '2026-W32',
            routineKcal: null,
            extraKcal: 500.04,
            totalKcal: 500.04,
            estimatedSessions: 2,
        },
    ];

    const forgottenApi: ForgottenMuscleAPI[] = [
        { muscle: 'back', totalSets: 4, weeksWithoutWork: 2, lastTrainedAt: null },
    ];

    const trendApi: ExerciseTrendAPI[] = [
        {
            exerciseId: 'ex-1',
            name: 'Press banca',
            category: 'CHEST',
            slope: 1.204,
            pctChange: 12.4,
            label: 'UP',
            weeksUsed: 6,
        },
    ];

    beforeEach(() => {
        spyOn(console, 'log');
        apollo = {
            query: jasmine.createSpy('apollo.query').and.returnValue(of({ data: null })),
        };

        TestBed.configureTestingModule({
            providers: [
                StatsChartsService,
                { provide: Apollo, useValue: apollo },
                { provide: AuthService, useValue: {} },
            ],
        });

        service = TestBed.inject(StatsChartsService);
    });

    describe('query shape', () => {
        // Las seis getters comparten la misma forma; se parametrizan para no
        // repetir seis veces un assertion idéntico. El tipo es explícito porque
        // un array de funciones distintas se inferiría como unión y `.subscribe`
        // dejaría de ser invocable.
        interface GetterCase {
            call: (i: StatsChartsQueryInput) => Observable<unknown>;
            field: string;
            payload: unknown[];
        }

        const getters: GetterCase[] = [
            {
                call: (i) => service.getOneRmWeekly(i),
                field: 'getStats1RmWeekly',
                payload: oneRmApi,
            },
            {
                call: (i) => service.getVolumeWeekly(i),
                field: 'getStatsVolumeWeekly',
                payload: volumeApi,
            },
            {
                call: (i) => service.getVolumeTotalWeekly(i),
                field: 'getStatsVolumeTotalWeekly',
                payload: volumeTotalApi,
            },
            {
                call: (i) => service.getCaloriesWeekly(i),
                field: 'getStatsCaloriesWeekly',
                payload: caloriesApi,
            },
            {
                call: (i) => service.getForgottenMuscles(i),
                field: 'getStatsForgottenMuscles',
                payload: forgottenApi,
            },
            {
                call: (i) => service.getExerciseTrend(i),
                field: 'getStatsExerciseTrend',
                payload: trendApi,
            },
        ];

        getters.forEach(({ call, field, payload }) => {
            describe(field, () => {
                it('sends variables: { input } with fetchPolicy network-only', () => {
                    apollo.query.and.returnValue(of({ data: { [field]: payload } }));

                    call(input).subscribe();

                    const options = apollo.query.calls.mostRecent().args[0];
                    expect(options.fetchPolicy).toBe('network-only');
                    expect(options.variables).toEqual({ input });
                });

                it('returns the wrapper VM', () => {
                    apollo.query.and.returnValue(of({ data: { [field]: payload } }));
                    let result: unknown = undefined;

                    call(input).subscribe((res: unknown) => (result = res));

                    expect(result).toBeDefined();
                });

                it('lets a GraphQL error through', () => {
                    apollo.query.and.returnValue(
                        throwError(() => ({
                            graphQLErrors: [
                                { message: 'nope', extensions: { code: 'BAD_REQUEST' } },
                            ],
                        })),
                    );
                    let error: unknown;

                    call(input).subscribe({ error: (err: unknown) => (error = err) });

                    expect(error).toEqual({ message: 'nope', code: 'BAD_REQUEST' });
                });

                it('maps UNAUTHORIZED through handleGraphqlError', () => {
                    apollo.query.and.returnValue(
                        throwError(() => ({
                            graphQLErrors: [
                                { message: 'Unauthorized', extensions: { code: 'UNAUTHORIZED' } },
                            ],
                        })),
                    );
                    let error: unknown;

                    call(input).subscribe({ error: (err: unknown) => (error = err) });

                    expect(error).toEqual(new Error('UNAUTHORIZED'));
                });
            });
        });
    });

    describe('wrapper output is applied, not passed through', () => {
        it('lowercases the category and rounds the 1RM metrics', () => {
            apollo.query.and.returnValue(of({ data: { getStats1RmWeekly: oneRmApi } }));
            let result: Observed<ReturnType<typeof service.getOneRmWeekly>> | undefined;

            service.getOneRmWeekly(input).subscribe((res) => (result = res));

            expect(result![0].category).toBe('chest');
            expect(result![0].weeks[0].best1RM).toBe(100);
        });

        it('rounds a percentage to an integer on the volume-total series', () => {
            apollo.query.and.returnValue(
                of({ data: { getStatsVolumeTotalWeekly: volumeTotalApi } }),
            );
            let result: Observed<ReturnType<typeof service.getVolumeTotalWeekly>> | undefined;

            service.getVolumeTotalWeekly(input).subscribe((res) => (result = res));

            expect(result![0].deltaPct).toBe(-36);
        });

        it('keeps routineKcal null on the calories series', () => {
            apollo.query.and.returnValue(of({ data: { getStatsCaloriesWeekly: caloriesApi } }));
            let result: Observed<ReturnType<typeof service.getCaloriesWeekly>> | undefined;

            service.getCaloriesWeekly(input).subscribe((res) => (result = res));

            expect(result![0].routineKcal).toBeNull();
        });

        it('translates the muscle label but keeps the raw muscle value', () => {
            apollo.query.and.returnValue(of({ data: { getStatsForgottenMuscles: forgottenApi } }));
            let result: Observed<ReturnType<typeof service.getForgottenMuscles>> | undefined;

            service.getForgottenMuscles(input).subscribe((res) => (result = res));

            expect(result![0].muscle).toBe('back');
            expect(result![0].label).toBe('Espalda');
        });
    });
});
