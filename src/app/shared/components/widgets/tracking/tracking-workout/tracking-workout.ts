import { Component, computed, DestroyRef, inject, Input } from '@angular/core';
import { Exercise } from '../../../../interfaces/exercise.interface';
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
import { WorkoutStateService } from '../../../../../core/services/workouts/workout-state.service';

@Component({
    selector: 'app-tracking-workout',
    imports: [ExerciseSelector, FormSelectComponent, BtnComponent, WorkoutInProgess],
    providers: [TrackingWorkoutFacade],
    standalone: true,
    templateUrl: './tracking-workout.html',
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
                    {} as { [key: string]: Exercise[] },
                ),
        );
    });

    // ngOnInit() {
    //     console.log(this.workoutDate);
    //     if (this.workoutDate === undefined) return;
    //     if (this.workoutDate !== undefined && this.workoutDate !== null)
    //         this.facade.initFacade(this.workoutDate()!);
    // }

    toggleExercise(ex: ExercisePerformanceVM) {
        this.facade.toggleExercise(ex);
    }

    clear() {
        this.facade.clear();
    }

    startRoutineTracking() {
        this.facade.startRoutineTracking();
    }

    removeExercise(exerciseId: string) {
        this.facade.removeExercise(exerciseId);
    }

    get selectControl(): FormControl<string> {
        return this.facade.exerciseForm.get('option') as FormControl<string>;
    }
}
