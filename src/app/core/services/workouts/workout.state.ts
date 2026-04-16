import { computed, DestroyRef, effect, inject, Injectable, signal } from '@angular/core';
import {
    ExercisePerformanceVM,
    LocalDate,
    WorkoutSessionVM,
} from '../../../shared/interfaces/tracking.interface';
import { PlanTrackingService } from '../trackings/plan-tracking.service';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { take } from 'rxjs';
import { DateService } from '../date.service';

@Injectable({
    providedIn: 'root',
})
export class WorkoutStateService {
    destroyRef = inject(DestroyRef);

    private trackingSvc = inject(PlanTrackingService);
    private dateSvc = inject(DateService);
    private tracking = toSignal(this.trackingSvc.trackingPlanVM$, { initialValue: null });

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

    private loadWorkout(date: LocalDate) {
        this.selectedDate.set(date);

        this.trackingSvc.getWorkout(date).subscribe((workout) => {
            if (!workout) return;
            this.workoutSession.set(workout);
        });
    }
}
