import { computed, effect, inject, Injectable, Signal, signal } from '@angular/core';
import { PlanTrackingService } from '../../../../../../core/services/trackings/plan-tracking.service';
import { Exercise, ExerciseTracking } from '../../../../../interfaces/exercise.interface';
import { ExercisesService } from '../../../../../../core/services/exercises/exercises.service';
import { ExercisePerformanceVM } from '../../../../../interfaces/tracking.interface';
import { FormControlsOf } from '../../../../../utils/form-types.util';
import { FormControl, FormGroup } from '@angular/forms';

type selectFormType = FormControlsOf<{ option: string }>;

@Injectable()
export class WorkoutInProgressFacade {
    trackingSvc = inject(PlanTrackingService);
    exercisesSvc = inject(ExercisesService);

    exercisesSelected = signal<ExercisePerformanceVM[]>([]);
    exercises = signal<Exercise[]>([]);

    // performanceForm: FormGroup<selectFormType> = new FormGroup<selectFormType>({
    //     option: new FormControl([], { nonNullable: true }),
    // });

    // FormGroup<selectFormType> {
    //     return new FormGroup<selectFormType>({
    //         option: new FormControl([], { nonNullable: true }),
    //     });
    constructor() {
        effect(() => {
            this.exercisesSvc
                .getExercises()
                .subscribe((exercises) => this.exercises.set(exercises));
        });
    }

    exercisesWorkout = computed(() => {
        if (this.exercises().length === 0 || this.exercisesSelected().length === 0) return;
        return this.exercisesSelected().map((ex) => {
            const data = this.exercises().find((e) => e.id === ex.exerciseId)!;

            // const sets = new Array(ex.series).map(() => ({ reps: 0, weights: 0 }));

            return { ...data };
        });
    });
}
