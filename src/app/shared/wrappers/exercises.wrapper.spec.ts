import { Exercise, ExerciseCategory } from '../interfaces/exercise.interface';
import { wrapperExerciseAPItoVM } from './exercises.wrapper';

describe('wrapperExerciseAPItoVM (TEST-004)', () => {
    const buildExercise = (overrides: Partial<Exercise> = {}): Exercise => ({
        id: 'ex-1',
        name: 'Bench Press',
        description: 'Chest press',
        category: ExerciseCategory.CHEST,
        usesWeight: true,
        ...overrides,
    });

    it('maps an exercise to the ExercisePerformanceVM shape with defaults', () => {
        const [vm] = wrapperExerciseAPItoVM([buildExercise()]);

        expect(vm).toEqual({
            exerciseId: 'ex-1',
            name: 'Bench Press',
            series: 0,
            category: ExerciseCategory.CHEST,
            sets: [],
            usesWeight: true,
            isFavorite: false,
        });
    });

    it('preserves isFavorite when it is set', () => {
        const [vm] = wrapperExerciseAPItoVM([buildExercise({ isFavorite: true })]);

        expect(vm.isFavorite).toBe(true);
    });

    it('returns an empty array for an empty catalog', () => {
        expect(wrapperExerciseAPItoVM([])).toEqual([]);
    });

    it('passes the category through without runtime normalization (BR-004)', () => {
        const legacyUppercase = { ...buildExercise(), category: 'CHEST' as ExerciseCategory };

        const [vm] = wrapperExerciseAPItoVM([legacyUppercase]);

        expect(vm.category).toBe('CHEST');
    });
});
