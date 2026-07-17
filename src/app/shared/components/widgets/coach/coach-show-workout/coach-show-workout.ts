import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { ExercisePerformanceVM, WorkoutSessionVM } from '../../../../interfaces/tracking.interface';
import { ExerciseCategoryPipe } from '../../../../pipes/exercise-category.pipe';

@Component({
    selector: 'app-coach-show-workout',
    imports: [CommonModule, ExerciseCategoryPipe],
    templateUrl: './coach-show-workout.html',
    styles: ``,
})
export class CoachShowWorkout {
    workout = input<WorkoutSessionVM | null>(null);
    dayFocus = input<string | undefined>();

    exercisesSelectedOrdered = computed(() => {
        const w = this.workout();
        if (!w || !w.exercises.length) return [];

        return Object.entries(
            w.exercises
                .sort((a, b) => a.name.localeCompare(b.name))
                .reduce(
                    (acc, item) => {
                        if (!acc[item.category]) {
                            acc[item.category] = [];
                        }
                        acc[item.category].push(item);
                        return acc;
                    },
                    {} as Record<string, ExercisePerformanceVM[]>,
                ),
        );
    });
}
