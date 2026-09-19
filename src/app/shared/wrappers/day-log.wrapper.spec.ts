import {
    RemoveWorkoutSessionFromDayLogResultAPI,
    UpdateDayLogResultAPI,
} from '../interfaces/api/day-log-api.interface';
import { Exercise, ExerciseCategory } from '../interfaces/exercise.interface';
import {
    apiDateToLocalDate,
    wrapperDayLogApiToVM,
    wrapperDayLogSummaryApiToVM,
    wrapperRemoveWorkoutSessionFromDayLogApiToVM,
    wrapperUpdateDayLogApiToVM,
} from './day-log.wrapper';

describe('apiDateToLocalDate (TEST-001)', () => {
    const ISO = '2026-05-01T02:30:00.000Z';

    const withTimezone = (timeZone: string) => {
        const resolved = new Intl.DateTimeFormat('en-US', { timeZone }).resolvedOptions();
        spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').and.returnValue(resolved);
    };

    it('converts an ISO instant to the LocalDate of the resolved timezone (UTC-3)', () => {
        withTimezone('America/Argentina/Buenos_Aires');
        expect(apiDateToLocalDate(ISO)).toBe('2026-04-30');
    });

    it('converts the same ISO instant to the LocalDate of another timezone (UTC+9)', () => {
        withTimezone('Asia/Tokyo');
        expect(apiDateToLocalDate(ISO)).toBe('2026-05-01');
    });

    it('returns a plain yyyy-MM-dd string without time information', () => {
        withTimezone('UTC');
        expect(apiDateToLocalDate(ISO)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('converts the date field of a day-log payload', () => {
        withTimezone('America/Argentina/Buenos_Aires');
        const vm = wrapperDayLogApiToVM(
            {
                id: 'day-1',
                date: ISO,
                extraSessionIds: [],
                status: 'pending',
                active: true,
                completed: false,
            },
            [],
        );
        expect(vm.date).toBe('2026-04-30');
    });

    it('converts the date field of a day-log summary payload', () => {
        withTimezone('America/Argentina/Buenos_Aires');
        const vm = wrapperDayLogSummaryApiToVM({
            id: 'day-1',
            date: ISO,
            completed: false,
            active: true,
            status: 'pending',
        });
        expect(vm.date).toBe('2026-04-30');
    });
});

describe('wrapperUpdateDayLogApiToVM', () => {
    const catalog: Exercise[] = [
        { id: 'ex-1', name: 'Press banca', category: ExerciseCategory.CHEST, usesWeight: true },
    ];

    it('returns an empty object for a null payload', () => {
        expect(wrapperUpdateDayLogApiToVM(null, [])).toEqual({});
    });

    it('maps status, active, completed and notes', () => {
        const payload: UpdateDayLogResultAPI = {
            id: 'day-1',
            status: 'complete',
            active: true,
            completed: false,
            notes: 'nota',
        };

        expect(wrapperUpdateDayLogApiToVM(payload, [])).toEqual(
            jasmine.objectContaining({
                id: 'day-1',
                status: 'complete',
                active: true,
                completed: false,
                notes: 'nota',
            }),
        );
    });

    it('maps the workoutSessionId when present', () => {
        const res = wrapperUpdateDayLogApiToVM({ id: 'day-1', workoutSessionId: 'ws-1' }, []);
        expect(res.workoutSessionId).toBe('ws-1');
    });

    it('omits the workoutSessionId key when it is not provided', () => {
        const res = wrapperUpdateDayLogApiToVM({ id: 'day-1' }, []);
        expect('workoutSessionId' in res).toBe(false);
    });

    it('normalizes a null workoutSessionId to undefined', () => {
        const res = wrapperUpdateDayLogApiToVM({ id: 'day-1', workoutSessionId: null }, []);
        expect(res.workoutSessionId).toBeUndefined();
    });

    it('maps exercises using the exercise catalog', () => {
        const res = wrapperUpdateDayLogApiToVM(
            {
                id: 'day-1',
                exercises: [{ exerciseId: 'ex-1', series: 3, sets: [{ reps: 10, weights: 50 }] }],
            },
            catalog,
        );

        expect(res.exercises?.length).toBe(1);
        expect(res.exercises?.[0].exerciseId).toBe('ex-1');
        expect(res.exercises?.[0].name).toBe('Press banca');
        expect(res.exercises?.[0].usesWeight).toBe(true);
        expect(res.exercises?.[0].category).toBe(ExerciseCategory.CHEST);
    });
});

describe('wrapperRemoveWorkoutSessionFromDayLogApiToVM', () => {
    it('returns an empty object for a null payload', () => {
        expect(wrapperRemoveWorkoutSessionFromDayLogApiToVM(null)).toEqual({});
    });

    it('clears the day exercises', () => {
        const res = wrapperRemoveWorkoutSessionFromDayLogApiToVM({ id: 'day-1' });
        expect(res.exercises).toEqual([]);
    });

    it('normalizes a null workoutSessionId to undefined', () => {
        const res = wrapperRemoveWorkoutSessionFromDayLogApiToVM({
            id: 'day-1',
            workoutSessionId: null,
        });
        expect(res.workoutSessionId).toBeUndefined();
    });

    it('falls back to pending status when the backend does not provide one', () => {
        const res = wrapperRemoveWorkoutSessionFromDayLogApiToVM({ id: 'day-1' });
        expect(res.status).toBe('pending');
    });

    it('keeps the status returned by the backend', () => {
        const res = wrapperRemoveWorkoutSessionFromDayLogApiToVM({
            id: 'day-1',
            status: 'complete',
        });
        expect(res.status).toBe('complete');
    });

    it('maps the day id', () => {
        const payload: RemoveWorkoutSessionFromDayLogResultAPI = {
            id: 'day-1',
            workoutSessionId: 'ws-1',
            status: 'pending',
        };
        expect(wrapperRemoveWorkoutSessionFromDayLogApiToVM(payload)).toEqual(
            jasmine.objectContaining({ id: 'day-1' }),
        );
    });
});
