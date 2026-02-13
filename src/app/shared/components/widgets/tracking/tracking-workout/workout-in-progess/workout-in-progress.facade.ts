import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { PlanTrackingService } from '../../../../../../core/services/trackings/plan-tracking.service';
import { ExercisesService } from '../../../../../../core/services/exercises/exercises.service';
import { ExercisePerformanceVM } from '../../../../../interfaces/tracking.interface';

interface SetData {
    reps: number;
    weights: number;
}

@Injectable()
export class WorkoutInProgressFacade {
    trackingSvc = inject(PlanTrackingService);
    exercisesSvc = inject(ExercisesService);

    exercisesSelected = signal<ExercisePerformanceVM[]>([]);
    exercises = signal<ExercisePerformanceVM[]>([]);

    workoutDate = signal<Date | null>(null);

    constructor() {
        effect(() => {
            this.exercisesSvc
                .getExercises()
                .pipe()
                .subscribe((exercises) => {
                    this.exercises.set(this.exercisesSvc.wrapperExerciseAPItoVM());
                });
        });
    }

    exercisesWorkout = computed(() => {
        if (this.exercises().length === 0 || this.exercisesSelected().length === 0) return;
        return this.exercisesSelected().map((ex) => {
            const data = this.exercises().find((e) => e.exerciseId === ex.exerciseId)!;
            console.log({ ...data, series: ex.series });

            return { ...data, series: ex.series };
        });
    });

    updateExercisePerformance(exerciseId: string, sets: SetData[]): void {
        const currentCache = new Map();
        currentCache.set(exerciseId, sets);
        console.log(currentCache);
        // this.performanceCache.set(currentCache);
        this.exercisesSelected.set(
            this.exercisesSelected().map((ex) =>
                ex.exerciseId === exerciseId ? { ...ex, series: sets.length, sets: sets } : ex,
            ),
        );
        console.log(this.workoutDate(), this.exercisesSelected());

        this.trackingSvc.setExercises(this.workoutDate()!, this.exercisesSelected());
    }
}
