import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { DateService, DayWithString } from '../../../../../../core/services/date.service';
import { TrackingVM } from '../../../../../interfaces/tracking.interface';
import { WorkoutStateService } from '../../../../../../core/services/workouts/workout-state.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { PlanTrackingService } from '../../../../../../core/services/trackings/plan-tracking.service';

@Component({
    selector: 'app-navigator-week',
    standalone: true,
    providers: [WorkoutStateService],
    templateUrl: './navigator-week.html',
    styles: ``,
})
export class NavigatorWeek {
    trackingSvc = inject(PlanTrackingService);
    dateSvc = inject(DateService);
    state = inject(WorkoutStateService);

    tracking = toSignal(this.trackingSvc.trackingPlanVM$);
    totalDays = 7;
    visibleDayCount = 4;
    currentDayIndex = signal<number>(0); // 0;

    // navigator = signal<number>(0);

    workoutDay = this.state.workoutSession();
    selectedDay = signal<DayWithString | null>(null);

    allDays = signal<DayWithString[]>(this.dateSvc.daysOfWeek(this.tracking()?.startDate!));

    visibleDays = computed(() => {
        console.log(this.allDays());
        return this.allDays().slice(
            this.currentDayIndex(),
            this.currentDayIndex() + this.visibleDayCount,
        );
    });

    constructor() {
        effect(() => {
            const t = this.tracking();
            if (t) {
                this.selectedDay.set(this.allDays()[0]);
            }
        });
    }

    previousDays(): void {
        const value = this.currentDayIndex() - 1;
        if (this.currentDayIndex() > 0) {
            this.currentDayIndex.set(value);
        }
    }

    nextDays(): void {
        const value = this.currentDayIndex() + 1;

        if (this.currentDayIndex() < this.totalDays - this.visibleDayCount) {
            this.currentDayIndex.set(value);
        }
    }

    selectDay(day: DayWithString): void {
        this.selectedDay.set(day);
    }
}
