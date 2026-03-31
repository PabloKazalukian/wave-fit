import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { ExercisesService } from '../../../../../core/services/exercises/exercises.service';
import { ExercisePerformanceVM, WorkoutSessionVM } from '../../../../interfaces/tracking.interface';
import { PlanTrackingService } from '../../../../../core/services/trackings/plan-tracking.service';
import { WorkoutStateService } from '../../../../../core/services/workouts/workout.state';

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
                    {} as { [key: string]: ExercisePerformanceVM[] },
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

    constructor() {}

    startRoutineTracking() {
        this.trackingSvc.createWorkout(this.workoutDate()!).subscribe({
            next: (res) => {
                // this.
            },
            error: () => {},
        });
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

    updateExerciseSet(exerciseId: string, setIndex: number, reps: number, weights: number) {
        // This could be used but updateWorkoutSession is preferred for full updates
        const date = this.workoutDate();
        if (!date) return;
        // If we want to keep this, we'd need a domain method for it, 
        // but for now we'll use updateWorkoutSession from the component
    }

    removeWorkoutSession() {
        const date = this.workoutDate();
        const workoutId = this.workoutVM()?.id;
        if (!date || !workoutId) return;
        this.trackingSvc.removeWorkoutSession(date, workoutId);
    }
}
