import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BtnComponent } from '../../shared/components/ui/btn/btn';
import { PlanDayService } from '../../core/services/day-logs/plan-day.service';
import { DayLogVM } from '../../shared/interfaces/day-log.interface';
import { TrackingDayComponent } from '../../shared/components/widgets/tracking/tracking-day/tracking-day';
import { ActiveTrackingService } from '../../core/services/trackings/active-tracking.service';
import { IconComponent } from '../../shared/components/ui/icon/icon';
import { SpinnerComponent } from '../../shared/components/ui/icon/spinner';

@Component({
    selector: 'app-my-day',
    imports: [BtnComponent, TrackingDayComponent, IconComponent, SpinnerComponent],
    standalone: true,
    templateUrl: './my-day.html',
})
export class MyDay implements OnInit {
    destroyRef = inject(DestroyRef);
    planDaySvc = inject(PlanDayService);
    activeTrackingSvc = inject(ActiveTrackingService);

    readonly loading = this.planDaySvc.loadingDayLog;
    readonly activeLoading = computed(
        () => this.activeTrackingSvc.loading() || !this.activeTrackingSvc.ready(),
    );
    creating = signal(false);
    dayLog = signal<DayLogVM | null>(null);

    ngOnInit() {
        this.planDaySvc.dayLog$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((dayLog) => this.dayLog.set(dayLog));
    }

    createDayLog() {
        if (this.creating()) return;
        this.creating.set(true);
        this.planDaySvc.createDayLog().subscribe({
            next: () => this.creating.set(false),
            error: () => this.creating.set(false),
        });
    }
}