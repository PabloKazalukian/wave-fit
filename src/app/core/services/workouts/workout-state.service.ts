import { computed, DestroyRef, effect, inject, Injectable, signal } from '@angular/core';
import {
    ExercisePerformanceVM,
    WorkoutSessionVM,
} from '../../../shared/interfaces/tracking.interface';
import { PlanTrackingService } from '../trackings/plan-tracking.service';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { take, takeUntil } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class WorkoutStateService {
    destroyRef = inject(DestroyRef);

    private trackingSvc = inject(PlanTrackingService);
    private tracking = toSignal(this.trackingSvc.trackingPlanVM$, { initialValue: null });

    selectedDate = signal<Date | null>(null);

    workoutSession = signal<WorkoutSessionVM | null>(null);

    constructor() {
        effect(() => {
            const tracking = this.tracking();

            if (!tracking || !tracking.workouts?.length) return;

            // Si todavía no hay fecha seleccionada

            if (!this.selectedDate()) {
                const firstDate = tracking.workouts[0].date;
                this.selectedDate.set(new Date(firstDate));
                return;
            }
            this.trackingSvc
                .getWorkout(this.selectedDate()!)
                .pipe(take(1), takeUntilDestroyed(this.destroyRef))
                .subscribe((workout) => {
                    if (!workout) return;
                    this.workoutSession.set(workout);
                    console.log(this.workoutSession());
                });
        });
    }

    readonly exercises = computed(() => this.workoutSession()?.exercises ?? []);

    setDate(date: Date) {
        // this.selectedDate.set(date);
        this.loadWorkout(date);
    }

    updateExercise(ex: ExercisePerformanceVM) {}

    private loadWorkout(date: Date) {
        this.selectedDate.set(date);

        this.trackingSvc.getWorkout(date).subscribe((workout) => {
            if (!workout) return;
            this.workoutSession.set(workout);
        });
    }
}
