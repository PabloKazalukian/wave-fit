import { TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';
import { Observable, of, throwError } from 'rxjs';
import { StatsService } from './stats.service';
import {
    PersonalRecordVM,
    StatsCategory,
    TopExerciseVM,
} from '../../../shared/interfaces/stats.interface';
import {
    AdherenceStatsAPI,
    PersonalRecordsStatsAPI,
    TopExercisesStatsAPI,
    TopRoutinesStatsAPI,
} from '../../../shared/interfaces/api/stats-api.interface';

type Observed<T> = T extends Observable<infer U> ? U : never;

describe('StatsService (TEST-001..004)', () => {
    let service: StatsService;
    let apollo: { query: jasmine.Spy };

    const exercisesApi: TopExercisesStatsAPI = {
        id: 'te-1',
        userId: 'u-1',
        computedAt: '2026-09-20T10:05:00.000Z',
        exercises: [
            {
                rank: 1,
                exerciseId: 'ex-1',
                name: 'Press banca',
                category: 'CHEST',
                totalSessions: 5,
                totalVolume: 1200,
                avgVolumePerSession: 240,
            },
        ],
    };

    const routinesApi: TopRoutinesStatsAPI = {
        id: 'tr-1',
        userId: 'u-1',
        computedAt: '2026-09-20T10:05:00.000Z',
        routines: [
            {
                rank: 1,
                planId: 'p-1',
                name: 'Push Pull Legs',
                totalWeeks: 4,
                totalSessions: 12,
                adherenceRate: 93,
            },
        ],
    };

    const recordsApi: PersonalRecordsStatsAPI = {
        id: 'pr-1',
        userId: 'u-1',
        computedAt: '2026-09-20T10:05:00.000Z',
        records: [
            {
                exerciseId: 'ex-1',
                exerciseName: 'Sentadilla',
                category: 'LEGS',
                oneRmEstimated: 120,
                bestWeight: 100,
                bestReps: 5,
                bestVolume: 500,
                achievedAt: '2026-09-15',
                previousOneRm: null,
            },
        ],
    };

    const adherenceApi: AdherenceStatsAPI = {
        id: 'ad-1',
        userId: 'u-1',
        computedAt: '2026-09-20T10:05:00.000Z',
        weeks: [
            {
                weekStartDate: '2026-09-14',
                totalDays: 7,
                completedDays: 5,
                skippedDays: 1,
                pendingDays: 1,
                adherencePercent: 71,
            },
        ],
    };

    beforeEach(() => {
        spyOn(console, 'log');
        apollo = {
            query: jasmine.createSpy('apollo.query').and.returnValue(of({ data: null })),
        };

        TestBed.configureTestingModule({
            providers: [StatsService, { provide: Apollo, useValue: apollo }],
        });

        service = TestBed.inject(StatsService);
    });

    it('getTopExercises requests network-only and maps the wrapper output', () => {
        apollo.query.and.returnValue(of({ data: { getTopExercises: exercisesApi } }));
        let result: Observed<ReturnType<typeof service.getTopExercises>> | undefined;

        service.getTopExercises().subscribe((res) => (result = res));

        expect(apollo.query.calls.mostRecent().args[0].fetchPolicy).toBe('network-only');
        const expected: TopExerciseVM = {
            rank: 1,
            exerciseId: 'ex-1',
            name: 'Press banca',
            category: 'chest' as StatsCategory,
            totalSessions: 5,
            totalVolume: 1200,
            avgVolumePerSession: 240,
        };
        expect(result!.exercises[0]).toEqual(expected);
    });

    it('getTopRoutines requests network-only and maps the wrapper output', () => {
        apollo.query.and.returnValue(of({ data: { getTopRoutines: routinesApi } }));
        let result: Observed<ReturnType<typeof service.getTopRoutines>> | undefined;

        service.getTopRoutines().subscribe((res) => (result = res));

        expect(apollo.query.calls.mostRecent().args[0].fetchPolicy).toBe('network-only');
        expect(result!.routines[0].adherenceRate).toBe(93);
    });

    it('getPersonalRecords requests network-only and maps the wrapper output', () => {
        apollo.query.and.returnValue(of({ data: { getPersonalRecords: recordsApi } }));
        let result: Observed<ReturnType<typeof service.getPersonalRecords>> | undefined;

        service.getPersonalRecords().subscribe((res) => (result = res));

        expect(apollo.query.calls.mostRecent().args[0].fetchPolicy).toBe('network-only');
        const expected: PersonalRecordVM = {
            exerciseId: 'ex-1',
            exerciseName: 'Sentadilla',
            category: 'legs' as StatsCategory,
            oneRmEstimated: 120,
            bestWeight: 100,
            bestReps: 5,
            bestVolume: 500,
            achievedAt: '2026-09-15',
            previousOneRm: null,
        };
        expect(result!.records[0]).toEqual(expected);
    });

    it('getAdherence requests network-only and maps the wrapper output', () => {
        apollo.query.and.returnValue(of({ data: { getAdherence: adherenceApi } }));
        let result: Observed<ReturnType<typeof service.getAdherence>> | undefined;

        service.getAdherence().subscribe((res) => (result = res));

        expect(apollo.query.calls.mostRecent().args[0].fetchPolicy).toBe('network-only');
        expect(result!.weeks[0]).toEqual({
            weekStartDate: '2026-09-14',
            totalDays: 7,
            completedDays: 5,
            skippedDays: 1,
            pendingDays: 1,
            adherencePercent: 71,
        });
    });

    it('propagates GraphQL errors from the error handler', () => {
        apollo.query.and.returnValue(
            throwError(() => ({
                graphQLErrors: [{ message: 'nope', extensions: { code: 'FORBIDDEN' } }],
            })),
        );
        let error: { message: string; code: string } | undefined;

        service.getTopExercises().subscribe({ error: (err) => (error = err) });

        expect(error).toEqual({ message: 'nope', code: 'FORBIDDEN' });
    });
});
