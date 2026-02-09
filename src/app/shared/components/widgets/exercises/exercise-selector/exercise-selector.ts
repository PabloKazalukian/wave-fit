import { Component, input, output } from '@angular/core';
import { Exercise } from '../../../../interfaces/exercise.interface';

@Component({
    selector: 'app-exercise-selector',
    standalone: true,
    templateUrl: './exercise-selector.html',
    styles: ``,
})
export class ExerciseSelector {
    exercises = input<Exercise[]>();
    exercisesSelected = input<Exercise[]>();
    changeExercise = output<Exercise>();

    toggleExercise(ex: Exercise) {
        this.changeExercise.emit(ex);
    }

    isSelected(ex: Exercise): boolean {
        return this.exercisesSelected()?.some((e) => e.id === ex.id) || false;
    }
}
