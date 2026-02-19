import { Component, effect, Input } from '@angular/core';
import { Exercise } from '../../../../../interfaces/exercise.interface';
import { ExerciseCategoryPipe } from '../../../../../pipes/exercise-category.pipe';

@Component({
    selector: 'app-routine-exercises',
    imports: [ExerciseCategoryPipe],
    standalone: true,
    templateUrl: './routine-exercises.html',
    styles: ``,
})
export class RoutineExercises {
    @Input() exercises: Exercise[] = [];

    constructor() {
        effect(() => console.log(this.exercises));
    }
}
