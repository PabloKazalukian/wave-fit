import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { BtnComponent } from '../../shared/components/ui/btn/btn';
import { PlanTrackingService } from '../../core/services/trackings/plan-tracking.service';
import { PlanDayService } from '../../core/services/day-logs/plan-day.service';
import { TrackingVM } from '../../shared/interfaces/tracking.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth/auth.service';
import { TrackingWeekComponent } from '../../shared/components/widgets/tracking/tracking-week/tracking-week';
import { TrackingWeekSkeletonComponent } from '../../shared/components/widgets/tracking/tracking-week/tracking-week-skeleton';
import { ActivationSelector } from '../../shared/components/widgets/my-week/activation-selector/activation-selector';
import { LogMode } from '../../shared/utils/profile.types';
import { Router } from '@angular/router';

@Component({
    selector: 'app-my-week',
    imports: [
        BtnComponent,
        TrackingWeekComponent,
        TrackingWeekSkeletonComponent,
        ActivationSelector,
    ],
    standalone: true,
    templateUrl: './my-week.html',
})
export class MyWeek implements OnInit {
    destroyRef = inject(DestroyRef);
    trackingSvc = inject(PlanTrackingService);
    planDaySvc = inject(PlanDayService);
    authSvc = inject(AuthService);
    router = inject(Router);

    hasActiveTracking = signal<boolean>(true);
    tracking = signal<TrackingVM | null>(null);
    readonly loading = this.trackingSvc.loadingTracking;

    mode = signal<LogMode>('week');

    userId = signal<string>('');

    ngOnInit() {
        this.trackingSvc.trackingPlanVM$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((tracking) => {
                this.tracking.set(tracking);
                this.hasActiveTracking.set(!tracking);
            });
    }

    setMode(mode: LogMode) {
        this.mode.set(mode);
    }

    createTracking() {
        this.trackingSvc.createTracking().subscribe({
            next: (res) => {
                this.hasActiveTracking.set(false);
                if (res) this.tracking.set(res);
            },
            error: (err) => {
                console.log(err);
            },
        });
    }

    startDay() {
        this.planDaySvc.createDayLog().subscribe({
            next: () => {
                this.hasActiveTracking.set(false);
                this.router.navigate(['/my-day']);
            },
            error: (err) => {
                console.log(err);
            },
        });
    }
}

