import { computed, DestroyRef, effect, inject, Injectable, signal } from '@angular/core';
import {
    ExercisePerformanceVM,
    LocalDate,
    StatusWorkoutSession,
    StatusWorkoutSessionEnum,
    WorkoutSessionVM,
} from '../../../shared/interfaces/tracking.interface';
import { PlanTrackingService } from '../trackings/plan-tracking.service';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { take } from 'rxjs';
import { DateService } from '../date.service';
import { WorkoutStore } from './workout-store.interface';

@Injectable({
    providedIn: 'root',
})
export class WorkoutStateService implements WorkoutStore {
    destroyRef = inject(DestroyRef);

    private trackingSvc = inject(PlanTrackingService);
    private dateSvc = inject(DateService);
    private tracking = toSignal(this.trackingSvc.trackingPlanVM$, { initialValue: null });

    readonly loadingWorkoutCreation = this.trackingSvc.loadingWorkoutCreation;
    readonly loadingStatusWorkout = this.trackingSvc.loadingStatusWorkout;
    readonly loading = this.trackingSvc.loading;

    /** LocalDate "yyyy-MM-dd" del día actualmente seleccionado */
    selectedDate = signal<LocalDate | null>(null);
    outOfDateRange = signal<boolean>(false);

    workoutSession = signal<WorkoutSessionVM | null>(null);

    constructor() {
        effect(() => {
            const tracking = this.tracking();

            if (!tracking || !tracking.workouts?.length) return;

            if (!this.selectedDate()) {
                const today = this.dateSvc.todayLocalDate(); // ✅ LocalDate sin conversión implícita

                if (today >= tracking.startDate && today <= tracking.endDate) {
                    // ✅ Comparación de strings determinística
                    this.selectedDate.set(today);
                } else {
                    // Fuera del rango — usar el primer día del tracking
                    const firstDate = tracking.workouts[0].date; // ✅ ya es LocalDate
                    this.selectedDate.set(firstDate);
                    this.outOfDateRange.set(true);
                }
                return;
            }

            this.trackingSvc
                .getWorkout(this.selectedDate()!)
                .pipe(take(1), takeUntilDestroyed(this.destroyRef))
                .subscribe((workout) => {
                    if (!workout) return;
                    this.workoutSession.set(workout);
                });
        });
    }

    readonly exercises = computed(() => this.workoutSession()?.exercises ?? []);

    setDate(date: LocalDate) {
        this.loadWorkout(date);
    }

    updateExercises(exercises: ExercisePerformanceVM[]): void {
        const date = this.selectedDate();
        if (!date) return;

        this.trackingSvc.setExercises(date, exercises);

        const currentWorkout = this.workoutSession();
        if (currentWorkout) {
            this.workoutSession.set({ ...currentWorkout, exercises });
        }
    }

    createWorkout(date: LocalDate) {
        return this.trackingSvc.createWorkout(date);
    }

    setRestDay(
        date: LocalDate,
        workout: WorkoutSessionVM,
        status: StatusWorkoutSession,
    ) {
        return this.trackingSvc.setRestDay(date, workout, status as StatusWorkoutSessionEnum);
    }

    setRemoveAllExercises(date: LocalDate): void {
        this.trackingSvc.setRemoveAllExercises(date);
    }

    updateWorkoutStatus(date: LocalDate, status: StatusWorkoutSession): void {
        this.trackingSvc.updateWorkoutStatus(date, status);
    }

    updateWorkoutSession(date: LocalDate, workout: WorkoutSessionVM): void {
        this.trackingSvc.updateWorkoutSession(date, workout);
    }

    removeWorkoutSession(date: LocalDate, id: string) {
        return this.trackingSvc.removeWorkoutSession(date, id);
    }

    createWorkoutWithRoutine(routineDayId: string, date: LocalDate) {
        return this.trackingSvc.createWorkoutWithRoutine(routineDayId, date);
    }

    createRoutineFromWorkout(title: string, exerciseIds: string[]) {
        return this.trackingSvc.createRoutineFromWorkout(title, exerciseIds);
    }

    private loadWorkout(date: LocalDate) {
        this.selectedDate.set(date);

        this.trackingSvc.getWorkout(date).subscribe((workout) => {
            if (!workout) return;
            this.workoutSession.set(workout);
        });
    }
}
