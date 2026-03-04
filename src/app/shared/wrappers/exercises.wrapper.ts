import { Exercise } from '../interfaces/exercise.interface';
import { ExercisePerformanceVM } from '../interfaces/tracking.interface';

export function wrapperExerciseAPItoVM(exercises: Exercise[]): ExercisePerformanceVM[] {
    return exercises.map((ex) => ({
        exerciseId: ex.id!,
        name: ex.name,
        series: 0,
        category: ex.category,
        sets: [],
        usesWeight: ex.usesWeight,
    }));
}
