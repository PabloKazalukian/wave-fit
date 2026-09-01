import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { ExercisesService } from '../../../../../core/services/exercises/exercises.service';
import {
    ExercisePerformanceVM,
    StatusWorkoutSessionEnum,
    WorkoutSessionVM,
} from '../../../../interfaces/tracking.interface';
import { WORKOUT_STORE } from '../../../../../core/services/workouts/workout-store.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, of } from 'rxjs';

@Injectable()
export class TrackingWorkoutFacade {
    destroyRef = inject(DestroyRef);
    exerciseSvc = inject(ExercisesService);

    store = inject(WORKOUT_STORE);

    loadings = computed(() => this.store.loadingWorkoutCreation().state === true);

    readonly workoutDate = this.store.selectedDate;
    readonly workoutVM = this.store.workoutSession;
    readonly loadingStatusWorkout = this.store.loadingStatusWorkout;

    exercises = signal<ExercisePerformanceVM[]>([]);
    exercisesSelected = this.store.exercises;

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
    loading = this.store.loadingWorkoutCreation;

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
        this.store
            .createWorkout(this.workoutDate()!)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe();
    }

    setRestDay() {
        this._setWorkoutStatus(StatusWorkoutSessionEnum.REST);
    }

    setTrainingDay() {
        this._setWorkoutStatus(StatusWorkoutSessionEnum.NOT_STARTED);
    }

    private _setWorkoutStatus(status: StatusWorkoutSessionEnum) {
        if (!this.workoutDate()) return;
        this.store
            .setRestDay(this.workoutDate()!, this.workoutVM()!, status)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe();
    }

    setRemoveAllExercises() {
        if (!this.workoutDate()) return;
        this.store.setRemoveAllExercises(this.workoutDate()!);
    }

    setEditedStatus() {
        const date = this.workoutDate();
        if (!date) return;
        this.store.updateWorkoutStatus(date, 'edited');
    }

    setCompleteStatus() {
        const date = this.workoutDate();
        if (!date) return;
        this.store.updateWorkoutStatus(date, 'complete');
    }

    updateWorkoutSession(workout: WorkoutSessionVM) {
        const date = this.workoutDate();
        if (!date) return;
        this.store.updateWorkoutSession(date, workout);
    }

    removeWorkoutSession(): Observable<boolean> {
        const date = this.workoutDate();
        const workoutId = this.workoutVM()?.id;
        if (!date || !workoutId) return of(false);
        return this.store.removeWorkoutSession(date, workoutId);
    }
}
