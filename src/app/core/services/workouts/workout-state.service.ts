import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { WorkoutSessionAPI } from '../../../shared/interfaces/api/tracking-api.interface';
import {
    ExercisePerformanceVM,
    WorkoutSessionVM,
} from '../../../shared/interfaces/tracking.interface';
import { PlanTrackingService } from '../trackings/plan-tracking.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Injectable({
    providedIn: 'root',
})
export class WorkoutStateService {
    private trackingSvc = inject(PlanTrackingService);
    private tracking = toSignal(this.trackingSvc.trackingPlanVM$, { initialValue: null });

    selectedDate = signal<Date | null>(null);

    workoutSession = computed(() => {
        const tracking = this.tracking();
        const date = this.selectedDate();

        if (!tracking || !date || !tracking.workouts?.length) return null;

        return (
            tracking.workouts.find(
                (w) => new Date(w.date).toDateString() === date.toDateString(),
            ) ?? null
        );
    });

    constructor() {
        effect(() => {
            const tracking = this.tracking();

            if (!tracking || !tracking.workouts?.length) return;

            // Si todavía no hay fecha seleccionada
            if (!this.selectedDate()) {
                const firstDate = tracking.workouts[0].date;
                this.selectedDate.set(new Date(firstDate));
            }
        });
    }

    readonly exercises = computed(() => this.workoutSession()?.exercises ?? []);

    setDate(date: Date) {
        this.selectedDate.set(date);
        this.loadWorkout(date);
    }

    updateExercise(ex: ExercisePerformanceVM) {}

    private loadWorkout(date: Date) {}
}
