import { Component, computed, inject, signal } from '@angular/core';
import { ExerciseSelector } from '../../exercises/exercise-selector/exercise-selector';
import { options } from '../../../../interfaces/input.interface';
import { BtnComponent } from '../../../ui/btn/btn';
import { TrackingWorkoutFacade } from './tracking-workout.facade';
import {
    ExercisePerformanceVM,
    StatusWorkoutSessionEnum,
} from '../../../../interfaces/tracking.interface';
import { WorkoutInProgess } from './workout-in-progess/workout-in-progess';
import { IconComponent } from '../../../ui/icon/icon';
import { SpinnerComponent } from '../../../ui/icon/spinner';
import { CommonModule } from '@angular/common';
import { Loading } from '../../../ui/loading/loading';
import { switchAnimation } from '../../../../animations/animation';
import { DialogComponent } from '../../../ui/dialog/dialog';

@Component({
    selector: 'app-tracking-workout',
    imports: [
        CommonModule,
        ExerciseSelector,
        BtnComponent,
        WorkoutInProgess,
        IconComponent,
        SpinnerComponent,
        Loading,
        DialogComponent,
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

    exercisesSelectedOrdered = computed(() => {
        return Object.entries(
            this.facade
                .exercisesSelected()
                .sort((a, b) => a?.category.localeCompare(b?.category))
                .reduce(
                    (acc, item) => {
                        if (!acc[item?.category]) {
                            acc[item.category] = [];
                        }

                        acc[item.category].push(item);
                        return acc;
                    },
                    {} as { [key: string]: ExercisePerformanceVM[] },
                ),
        );
    });

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
