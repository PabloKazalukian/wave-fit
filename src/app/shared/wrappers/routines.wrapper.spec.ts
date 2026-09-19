import { ExerciseCategory } from '../interfaces/exercise.interface';
import { KindEnum, RoutineDay, RoutineDayCreate } from '../interfaces/routines.interface';
import { RoutineDayAPI } from '../interfaces/api/routines-api.interface';
import {
    wrapperRoutineDayAPItoRoutineDay,
    wrapperRoutineDayAPItoRoutineDayVM,
    wrapperRoutineDayCreateToPayload,
    wrapperRoutineDayToExerciseIds,
} from './routines.wrapper';

describe('routines.wrapper (TEST-005)', () => {
    const buildExercise = (
        id: string,
        category: ExerciseCategory,
    ): NonNullable<RoutineDayAPI['exercises']>[number] => ({
        order: 0,
        exercise: { id, name: `Exercise ${id}`, category, usesWeight: true },
    });

    const buildApi = (overrides: Partial<RoutineDayAPI> = {}): RoutineDayAPI => ({
        id: 'rd-1',
        title: 'Push',
        kind: 'REST',
        category: [],
        isFavorite: true,
        exercises: [buildExercise('ex-1', ExerciseCategory.CHEST)],
        ...overrides,
    });

    describe('wrapperRoutineDayAPItoRoutineDay', () => {
        it('maps the API shape and flattens exercises', () => {
            const [routine] = wrapperRoutineDayAPItoRoutineDay([buildApi()]);

            expect(routine.id).toBe('rd-1');
            expect(routine.title).toBe('Push');
            expect(routine.isFavorite).toBe(true);
            expect(routine.exercises?.map((e) => e.id)).toEqual(['ex-1']);
            expect(routine.type).toEqual([ExerciseCategory.CHEST]);
        });

        it('defaults isFavorite to false and dedupes categories', () => {
            const [routine] = wrapperRoutineDayAPItoRoutineDay([
                buildApi({
                    isFavorite: undefined,
                    exercises: [
                        buildExercise('ex-1', ExerciseCategory.CHEST),
                        buildExercise('ex-2', ExerciseCategory.CHEST),
                        buildExercise('ex-3', ExerciseCategory.BACK),
                    ],
                }),
            ]);

            expect(routine.isFavorite).toBe(false);
            expect(routine.type).toEqual([ExerciseCategory.CHEST, ExerciseCategory.BACK]);
        });

        it('hardcodes kind to WORKOUT (ignores API kind)', () => {
            const [routine] = wrapperRoutineDayAPItoRoutineDay([buildApi({ kind: 'REST' })]);

            expect(routine.kind).toBe(KindEnum.workout);
        });

        it('returns empty arrays when there are no exercises', () => {
            const [routine] = wrapperRoutineDayAPItoRoutineDay([
                buildApi({ exercises: undefined }),
            ]);

            expect(routine.exercises).toEqual([]);
            expect(routine.type).toEqual([]);
        });
    });

    describe('wrapperRoutineDayAPItoRoutineDayVM', () => {
        it('adds the UI fields expanded and day', () => {
            const [vm] = wrapperRoutineDayAPItoRoutineDayVM([buildApi()]);

            expect(vm.expanded).toBe(false);
            expect(vm.day).toBe(1);
            expect(vm.kind).toBe(KindEnum.workout);
            expect(vm.exercises?.map((e) => e.id)).toEqual(['ex-1']);
        });
    });

    describe('wrapperRoutineDayCreateToPayload', () => {
        it('maps exercises to { exercise, order } pairs', () => {
            const data: RoutineDayCreate = {
                title: 'Legs',
                type: [ExerciseCategory.LEGS],
                planId: 'plan-1',
                exercises: [
                    {
                        id: 'ex-1',
                        name: 'Squat',
                        category: ExerciseCategory.LEGS,
                        usesWeight: true,
                    },
                    {
                        id: 'ex-2',
                        name: 'Lunge',
                        category: ExerciseCategory.LEGS,
                        usesWeight: true,
                    },
                ],
            };

            const payload = wrapperRoutineDayCreateToPayload(data);

            expect(payload).toEqual({
                title: 'Legs',
                type: [ExerciseCategory.LEGS],
                planId: 'plan-1',
                exercises: [
                    { exercise: 'ex-1', order: 0 },
                    { exercise: 'ex-2', order: 1 },
                ],
            });
        });

        it('defaults exercises to an empty array', () => {
            const payload = wrapperRoutineDayCreateToPayload({ title: 'Empty' });

            expect(payload.exercises).toEqual([]);
        });
    });

    describe('wrapperRoutineDayToExerciseIds', () => {
        it('maps exercise ids', () => {
            const routine: RoutineDayCreate = {
                title: 'Legs',
                exercises: [
                    {
                        id: 'ex-1',
                        name: 'Squat',
                        category: ExerciseCategory.LEGS,
                        usesWeight: true,
                    },
                    { name: 'No id', category: ExerciseCategory.LEGS, usesWeight: true },
                ],
            };

            expect(wrapperRoutineDayToExerciseIds(routine)).toEqual(['ex-1', '']);
        });

        it('returns a placeholder when exercises are undefined', () => {
            expect(wrapperRoutineDayToExerciseIds({ title: 'Empty' })).toEqual(['']);
        });
    });

    it('keeps RoutineDay/RoutineDayVM shapes type-compatible', () => {
        const routine: RoutineDay = wrapperRoutineDayAPItoRoutineDay([buildApi()])[0];
        expect(routine.kind).toBe('WORKOUT');
    });
});
