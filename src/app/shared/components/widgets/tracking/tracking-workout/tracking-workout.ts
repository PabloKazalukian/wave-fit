import { Component, computed, DestroyRef, inject, Input } from '@angular/core';
import { Exercise } from '../../../../interfaces/exercise.interface';
import { ExerciseSelector } from '../../exercises/exercise-selector/exercise-selector';
import { FormControl } from '@angular/forms';
import { options } from '../../../../interfaces/input.interface';
import { FormSelectComponent } from '../../../ui/select/select';
import { BtnComponent } from '../../../ui/btn/btn';
import { TrackingWorkoutFacade } from './tracking-workout.facade';
import { StatusWorkoutSessionEnum } from '../../../../interfaces/tracking.interface';
import { WorkoutInProgess } from './workout-in-progess/workout-in-progess';

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
    @Input() workoutDate!: Date;

    exercisesSelectedOrdered = computed(() => {
        return Object.entries(
            this.facade
                .exercisesSelected()
                .sort((a, b) => a.category.localeCompare(b.category))
                .reduce(
                    (acc, item) => {
                        if (!acc[item.category]) {
                            acc[item.category] = [];
                        }

                        acc[item.category].push(item);
                        return acc;
                    },
                    {} as { [key: string]: Exercise[] },
                ),
        );
    });

    options = options;

    ngOnInit() {
        if (this.workoutDate !== undefined) this.facade.initFacade(this.workoutDate);
    }

    toggleExercise(ex: Exercise) {
        this.facade.toggleExercise(ex);
    }

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
