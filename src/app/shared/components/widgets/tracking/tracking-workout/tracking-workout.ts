import { Component, computed, inject, signal } from '@angular/core';
import { ExerciseSelector } from '../../exercises/exercise-selector/exercise-selector';
import { options } from '../../../../interfaces/input.interface';
import { BtnComponent } from '../../../ui/btn/btn';
import { TrackingWorkoutFacade } from './tracking-workout.facade';
import {
    ExercisePerformanceVM,
    StatusWorkoutSessionEnum,
} from '../../../../interfaces/tracking.interface';
import { IconComponent } from '../../../ui/icon/icon';
import { SpinnerComponent } from '../../../ui/icon/spinner';
import { CommonModule } from '@angular/common';
import { Loading } from '../../../ui/loading/loading';
import { switchAnimation } from '../../../../animations/animation';
import { DialogComponent } from '../../../ui/dialog/dialog';
import { WorkoutInProgress } from './workout-in-progress/workout-in-progress';
import { WorkoutCompleteList } from './workout-complete-list/workout-complete-list';
import { WorkoutEdition } from './workout-edition/workout-edition';

@Component({
    selector: 'app-tracking-workout',
    imports: [
        CommonModule,
        ExerciseSelector,
        BtnComponent,
        WorkoutInProgress,
        IconComponent,
        SpinnerComponent,
        Loading,
        DialogComponent,
        WorkoutCompleteList,
        WorkoutEdition,
    ],
    providers: [TrackingWorkoutFacade],
    standalone: true,
    templateUrl: './tracking-workout.html',
    animations: [switchAnimation],
})
export class TrackingWorkoutComponent {
    facade = inject(TrackingWorkoutFacade);

    StatusWorkoutSessionEnum = StatusWorkoutSessionEnum;
    options = options;

    isDialogOpen = signal(false);

    openDialog() {
        this.isDialogOpen.set(true);
    }

    closeDialog() {
        this.isDialogOpen.set(false);
    }

    startRoutineTracking() {
        this.facade.startRoutineTracking();
    }
}
