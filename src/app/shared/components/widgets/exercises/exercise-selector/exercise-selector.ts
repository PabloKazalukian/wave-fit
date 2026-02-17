import { Component, computed, inject } from '@angular/core';
import { ExercisePerformanceVM } from '../../../../interfaces/tracking.interface';
import { ExercisesService } from '../../../../../core/services/exercises/exercises.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { WorkoutStateService } from '../../../../../core/services/workouts/workout-state.service';

@Component({
    selector: 'app-exercise-selector',
    standalone: true,
    templateUrl: './exercise-selector.html',
    styles: ``,
})
export class ExerciseSelector {
    exercisesSvc = inject(ExercisesService);
    state = inject(WorkoutStateService);

    exercise = toSignal(this.exercisesSvc.getExercises(), { initialValue: [] });

    exercises = computed(() => this.exercisesSvc.wrapperExerciseAPItoVM());

    readonly exercisesSelected = this.state.exercises;

    toggleExercise(ex: ExercisePerformanceVM) {
        const exists = this.exercisesSelected()?.some((e) => e.exerciseId === ex.exerciseId);
        console.log(exists);
        if (exists) {
            this.state.updateExercises(
                this.exercisesSelected()?.filter((e) => e.exerciseId !== ex.exerciseId) || [],
            );
        } else {
            this.state.updateExercises([...(this.exercisesSelected() || []), ex]);
        }
    }

    isSelected(ex: ExercisePerformanceVM): boolean {
        return this.exercisesSelected()?.some((e) => e.exerciseId === ex.exerciseId) || false;
    }
}
