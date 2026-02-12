import { Component, input, output } from '@angular/core';
import { Exercise } from '../../../../interfaces/exercise.interface';
import { ExercisePerformanceVM } from '../../../../interfaces/tracking.interface';

@Component({
    selector: 'app-exercise-selector',
    standalone: true,
    templateUrl: './exercise-selector.html',
    styles: ``,
})
export class ExerciseSelector {
    exercises = input<ExercisePerformanceVM[]>();
    exercisesSelected = input<ExercisePerformanceVM[]>();
    changeExercise = output<ExercisePerformanceVM>();

    toggleExercise(ex: ExercisePerformanceVM) {
        this.changeExercise.emit(ex);
    }

    isSelected(ex: ExercisePerformanceVM): boolean {
        return this.exercisesSelected()?.some((e) => e.exerciseId === ex.exerciseId) || false;
    }
}
