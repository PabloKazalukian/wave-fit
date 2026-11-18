import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PlanDayService } from '../../../../../core/services/day-logs/plan-day.service';
import { WORKOUT_STORE } from '../../../../../core/services/workouts/workout-store.interface';
import { ExtraSessionService } from '../../../../../core/services/extra-session/extra-session.service';
import { ExtraSessionFormValue } from '../../../../interfaces/extra-session.interface';

@Injectable()
export class TrackingDayFacade {
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);
    private readonly planDaySvc = inject(PlanDayService);
    private readonly store = inject(WORKOUT_STORE);
    private readonly extraSessionSvc = inject(ExtraSessionService);

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

    /** Active-owner of extra-session creation (T5): the shared form only emits. */
    createExtraSession(value: ExtraSessionFormValue): void {
        this.extraSessionSvc
            .create(this.extraSessionSvc.toCreateInput(value))
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => this.showExtraSessionDialog.set(false),
                error: (err) => console.error('[TrackingDay] Error saving extra session:', err),
            });
    }
}
