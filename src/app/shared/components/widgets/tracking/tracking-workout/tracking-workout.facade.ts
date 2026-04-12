import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { ExercisesService } from '../../../../../core/services/exercises/exercises.service';
import { ExercisePerformanceVM, WorkoutSessionVM } from '../../../../interfaces/tracking.interface';
import { PlanTrackingService } from '../../../../../core/services/trackings/plan-tracking.service';
import { WorkoutStateService } from '../../../../../core/services/workouts/workout.state';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, of } from 'rxjs';

@Injectable()
export class TrackingWorkoutFacade {
    destroyRef = inject(DestroyRef);
    exerciseSvc = inject(ExercisesService);
    trackingSvc = inject(PlanTrackingService);

    state = inject(WorkoutStateService);

    loadings = computed(() => this.trackingSvc.loadingWorkoutCreation().state === true);

    readonly workoutDate = this.state.selectedDate;
    readonly workoutVM = this.state.workoutSession;

    exercises = signal<ExercisePerformanceVM[]>([]);
    exercisesSelected = this.state.exercises;

    exercisesSelectedOrdered = computed(() => {
        return Object.entries(
            this.exercisesSelected()
                .sort((a, b) => a?.name.localeCompare(b?.name))
                .reduce(
                    (acc, item) => {
                        if (!acc[item?.category]) {
                            acc[item.category] = [];
                        }

                        acc[item.category].push(item);
                        return acc;
                    },
                    {} as Record<string, ExercisePerformanceVM[]>,
                ),
        );
    });

    exercisesTracking = signal<ExercisePerformanceVM[]>([]);
    loading = this.trackingSvc.loadingWorkoutCreation;

    validateWorkout(): boolean {
        if (
            this.exercisesSelected().length === 0 &&
            this.workoutVM()?.exercises.length === 0 &&
            this.workoutVM()?.exercises.filter((ex) => ex.series === 0).length === 0
        )
            return false;
        if (this.workoutVM()?.exercises.find((ex) => ex.sets?.length === 0)) return false;
        return true;
    }

    startRoutineTracking() {
        this.trackingSvc
            .createWorkout(this.workoutDate()!)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe();
    }

    setRestDay() {
        if (!this.workoutDate()) return;
        this.trackingSvc.setRestDay(this.workoutDate()!, this.workoutVM()!);
    }

    setRemoveAllExercises() {
        if (!this.workoutDate()) return;
        this.trackingSvc.setRemoveAllExercises(this.workoutDate()!, this.workoutVM()!);
    }

    setEditedStatus() {
        const date = this.workoutDate();
        if (!date) return;
        this.trackingSvc.updateWorkoutStatus(date, 'edited');
    }

    setCompleteStatus() {
        const date = this.workoutDate();
        if (!date) return;
        this.trackingSvc.updateWorkoutStatus(date, 'complete');
    }

    updateWorkoutSession(workout: WorkoutSessionVM) {
        const date = this.workoutDate();
        if (!date) return;
        this.trackingSvc.updateWorkoutSession(date, workout);
    }

    removeWorkoutSession(): Observable<boolean> {
        const date = this.workoutDate();
        const workoutId = this.workoutVM()?.id;
        console.log('date', date);
        console.log('workoutId', this.workoutVM());
        if (!date || !workoutId) return of(false);
        return this.trackingSvc.removeWorkoutSession(date, workoutId);
    }
}
