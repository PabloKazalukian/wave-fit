import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { BtnComponent } from '../../shared/components/ui/btn/btn';
import { PlanTrackingService } from '../../core/services/trackings/plan-tracking.service';
import { PlanDayService } from '../../core/services/day-logs/plan-day.service';
import { TrackingVM } from '../../shared/interfaces/tracking.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth/auth.service';
import { ActiveTrackingService } from '../../core/services/trackings/active-tracking.service';
import { TrackingWeekComponent } from '../../shared/components/widgets/tracking/tracking-week/tracking-week';
import { TrackingWeekSkeletonComponent } from '../../shared/components/widgets/tracking/tracking-week/tracking-week-skeleton';
import { ActivationSelector } from '../../shared/components/widgets/my-week/activation-selector/activation-selector';
import { LogMode } from '../../shared/utils/profile.types';
import { Router } from '@angular/router';
import { IconComponent } from '../../shared/components/ui/icon/icon';
import { SpinnerComponent } from '../../shared/components/ui/icon/spinner';

@Component({
    selector: 'app-my-week',
    imports: [
        BtnComponent,
        TrackingWeekComponent,
        TrackingWeekSkeletonComponent,
        ActivationSelector,
        IconComponent,
        SpinnerComponent,
    ],
    standalone: true,
    templateUrl: './my-week.html',
})
export class MyWeek implements OnInit {
    destroyRef = inject(DestroyRef);
    trackingSvc = inject(PlanTrackingService);
    planDaySvc = inject(PlanDayService);
    authSvc = inject(AuthService);
    activeTrackingSvc = inject(ActiveTrackingService);
    router = inject(Router);

    hasActiveTracking = signal<boolean>(true);
    tracking = signal<TrackingVM | null>(null);
    readonly loading = this.trackingSvc.loadingTracking;
    readonly activeLoading = computed(
        () => this.activeTrackingSvc.loading() || !this.activeTrackingSvc.ready(),
    );
    starting = signal(false);

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
        this.starting.set(true);
        this.trackingSvc.createTracking().subscribe({
            next: (res) => {
                this.starting.set(false);
                this.hasActiveTracking.set(false);
                if (res) this.tracking.set(res);
            },
            error: (err) => {
                this.starting.set(false);
                console.log(err);
            },
        });
    }

    startDay() {
        this.starting.set(true);
        this.planDaySvc.createDayLog().subscribe({
            next: () => {
                this.starting.set(false);
                this.hasActiveTracking.set(false);
                this.router.navigate(['/my-day']);
            },
            error: (err) => {
                this.starting.set(false);
                console.log(err);
            },
        });
    }
}

