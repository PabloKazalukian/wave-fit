import { UpdateDayLogResultAPI } from '../interfaces/api/day-log-api.interface';
import { Exercise, ExerciseCategory } from '../interfaces/exercise.interface';
import { wrapperUpdateDayLogApiToVM } from './day-log.wrapper';

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
