import { Component, inject } from '@angular/core';
import { TrackingWorkoutFacade } from '../tracking-workout.facade';
import { CommonModule } from '@angular/common';
import { BtnComponent } from '../../../../ui/btn/btn';

@Component({
    selector: 'app-workout-complete-list',
    imports: [CommonModule, BtnComponent],
    standalone: true,
    templateUrl: './workout-complete-list.html',
    styles: ``,
})
export class WorkoutCompleteList {
    facade = inject(TrackingWorkoutFacade);
}
