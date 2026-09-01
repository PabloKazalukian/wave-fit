import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PlanDayService } from '../../../../../core/services/day-logs/plan-day.service';
import { WORKOUT_STORE } from '../../../../../core/services/workouts/workout-store.interface';

@Injectable()
export class TrackingDayFacade {
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);
    private readonly planDaySvc = inject(PlanDayService);
    private readonly store = inject(WORKOUT_STORE);

    showExtraSessionDialog = signal(false);
    showConfirmDialog = signal(false);

    readonly loading = this.planDaySvc.loadingDayLog;
    readonly workout = this.store.workoutSession;

    completeDay() {
        this.showConfirmDialog.set(true);
    }

    onConfirm() {
        this.planDaySvc
            .completeDayLog(true)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.showConfirmDialog.set(false);
                    this.router.navigate(['/my-day/success']);
                },
                error: (err) => console.error(err),
            });
    }
}
