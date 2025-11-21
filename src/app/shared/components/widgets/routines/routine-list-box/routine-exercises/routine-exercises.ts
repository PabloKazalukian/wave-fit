import { Component, Input } from '@angular/core';
import { Exercise } from '../../../../../interfaces/exercise.interface';

@Component({
    selector: 'app-routine-exercises',
    imports: [],
    standalone: true,
    templateUrl: './routine-exercises.html',
    styles: ``,
})
export class RoutineExercises {
    @Input() exercises: Exercise[] = [];

    constructor() {}

    ngOnInit(): void {}
}
