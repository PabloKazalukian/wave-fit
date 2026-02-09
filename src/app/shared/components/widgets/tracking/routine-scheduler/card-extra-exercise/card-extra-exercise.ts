import { Component, input, output, signal } from '@angular/core';
import { ExerciseRoutine } from '../routine-scheduler';
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
    exercise = input<ExerciseRoutine>({} as ExerciseRoutine);

    deleteExercise = output<ExerciseRoutine>();
    toggleInput = output<void>();

    toggleExerciseInput(exercise: ExerciseRoutine) {
        this.toggleInput.emit();
    }

    deleteExercises(exercise: ExerciseRoutine, event: Event) {
        event.stopPropagation();
        this.deleteExercise.emit(exercise);
    }
}
