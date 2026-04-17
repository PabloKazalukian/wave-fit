import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { PlanTrackingService } from '../../../../../core/services/trackings/plan-tracking.service';
import { WorkoutStateService } from '../../../../../core/services/workouts/workout.state';
import { StatusWorkoutSessionEnum, TrackingVM } from '../../../../interfaces/tracking.interface';
import { PlansApiService } from '../../../../../core/services/plans/api/plans.api';
import { catchError, map, of, switchMap } from 'rxjs';

@Injectable()
export class TrackingWeekFacade {
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);
    private readonly state = inject(WorkoutStateService);
    private readonly trackingSvc = inject(PlanTrackingService);
    private readonly planApi = inject(PlansApiService);

    showExtraSessionDialog = signal(false);

    readonly loading = this.trackingSvc.loading;
    readonly tracking = signal<TrackingVM | null>(null);
    readonly planName = toSignal(
        this.trackingSvc.trackingPlanVM$.pipe(
            switchMap((t) => {
                if (!t?.planId) return of('');

                return this.planApi.getRoutinePlanById(t.planId).pipe(
                    map((plan) => plan?.name ?? ''),
                    catchError(() => of('')),
                );
            }),
        ),
        { initialValue: '' },
    );

    readonly outOfDateRange = this.state.outOfDateRange;
    showOutOfRangeDialog = signal(true);

    showConfirmDialog = signal(false);

    isWeekComplete = computed(() => {
        const t = this.tracking();
        if (!t || !t.workouts) return false;

        // La semana está completa si ningún workout está en estado NOT_STARTED
        return t.workouts.every((w) => w.status !== StatusWorkoutSessionEnum.NOT_STARTED);
    });

    completeWeek() {
        this.showConfirmDialog.set(true);
    }

    onConfirm() {
        this.executeComplete(true);
    }

    onConfirmIncomplete() {
        this.executeComplete(false);
    }

    onConfirmOutOfRange() {
        this.executeComplete(false);
        this.showOutOfRangeDialog.set(false);
    }

    onCancelOutOfRange() {
        this.showOutOfRangeDialog.set(false);
    }

    private executeComplete(isComplete: boolean) {
        this.trackingSvc
            .completeTracking(isComplete)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.showConfirmDialog.set(false);
                    this.router.navigate(['/my-week/success']);
                },
                error: (err) => console.error(err),
            });
    }

    updateTracking(tracking: TrackingVM | null) {
        this.tracking.set(tracking);
    }
}
