import { Component, computed, DestroyRef, inject } from '@angular/core';
import { ExerciseSelector } from '../../exercises/exercise-selector/exercise-selector';
import { FormControl } from '@angular/forms';
import { options } from '../../../../interfaces/input.interface';
import { FormSelectComponent } from '../../../ui/select/select';
import { BtnComponent } from '../../../ui/btn/btn';
import { TrackingWorkoutFacade } from './tracking-workout.facade';
import {
    ExercisePerformanceVM,
    StatusWorkoutSessionEnum,
} from '../../../../interfaces/tracking.interface';
import { WorkoutInProgess } from './workout-in-progess/workout-in-progess';
import { IconComponent } from '../../../ui/icon/icon';
import { SpinnerComponent } from '../../../ui/icon/spinner';
import { DatePipe } from '@angular/common';
import { Loading } from '../../../ui/loading/loading';
import { switchAnimation } from '../../../../animations/animation';

@Component({
    selector: 'app-tracking-workout',
    imports: [
        ExerciseSelector,
        FormSelectComponent,
        BtnComponent,
        WorkoutInProgess,
        IconComponent,
        SpinnerComponent,
        DatePipe,
        Loading,
    ],
    providers: [TrackingWorkoutFacade],
    standalone: true,
    templateUrl: './tracking-workout.html',
    animations: [switchAnimation],
})
export class TrackingWorkoutComponent {
    destroyRef = inject(DestroyRef);
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

    // viewStatus = computed(() => this.facade.workoutVM()?.status ?? 'idle');

    clear() {
        this.facade.clear();
    }

    startRoutineTracking() {
        this.facade.startRoutineTracking();
    }

    get selectControl(): FormControl<string> {
        return this.facade.exerciseForm.get('option') as FormControl<string>;
    }
}
