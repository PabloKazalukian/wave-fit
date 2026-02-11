import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { WorkoutInProgressFacade } from './workout-in-progress.facade';
import { Exercise } from '../../../../../interfaces/exercise.interface';
import { ExercisePerformanceVM } from '../../../../../interfaces/tracking.interface';

@Component({
    selector: 'app-workout-in-progess',
    imports: [],
    standalone: true,
    providers: [WorkoutInProgressFacade],
    templateUrl: './workout-in-progess.html',
    styles: ``,
})
export class WorkoutInProgess {
    facade = inject(WorkoutInProgressFacade);

    exercisesSelected = input<ExercisePerformanceVM[]>([]);

    constructor() {
        effect(() => {
            const eff = this.exercisesSelected();
            if (eff !== null || eff !== undefined) this.facade.exercisesSelected.set(eff);
        });
    }
}
