import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BtnComponent } from '../../shared/components/ui/btn/btn';
import { PlanDayService } from '../../core/services/day-logs/plan-day.service';
import { DayLogVM } from '../../shared/interfaces/day-log.interface';
import { TrackingDayComponent } from '../../shared/components/widgets/tracking/tracking-day/tracking-day';

@Component({
    selector: 'app-my-day',
    imports: [BtnComponent, TrackingDayComponent],
    standalone: true,
    templateUrl: './my-day.html',
})
export class MyDay implements OnInit {
    destroyRef = inject(DestroyRef);
    planDaySvc = inject(PlanDayService);

    readonly loading = this.planDaySvc.loadingDayLog;
    dayLog = signal<DayLogVM | null>(null);

    ngOnInit() {
        this.planDaySvc.dayLog$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((dayLog) => this.dayLog.set(dayLog));
    }

    createDayLog() {
        this.planDaySvc.createDayLog().subscribe();
    }
}
