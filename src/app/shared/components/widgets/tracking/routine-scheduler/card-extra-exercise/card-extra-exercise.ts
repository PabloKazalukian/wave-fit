import { Component, input, output, signal } from '@angular/core';
import { Exercise } from '../routine-scheduler';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-card-extra-exercise',
    imports: [CommonModule, FormsModule],
    standalone: true,
    templateUrl: './card-extra-exercise.html',
    styles: ``,
})
export class CardExtraExercise {
    exercise = input<Exercise>({} as Exercise);

    deleteExercise = output<Exercise>();
    toggleInput = output<void>();

    toggleExerciseInput(exercise: Exercise) {
        this.toggleInput.emit();
    }

    deleteExercises(exercise: Exercise, event: Event) {
        event.stopPropagation();
        this.deleteExercise.emit(exercise);
    }
}
