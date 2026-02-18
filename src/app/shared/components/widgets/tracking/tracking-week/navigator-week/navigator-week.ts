import { Component, computed, effect, inject, signal } from '@angular/core';
import { DateService, DayWithString } from '../../../../../../core/services/date.service';
import { WorkoutStateService } from '../../../../../../core/services/workouts/workout-state.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { PlanTrackingService } from '../../../../../../core/services/trackings/plan-tracking.service';
import { Loading } from '../../../../ui/loading/loading';

@Component({
    selector: 'app-navigator-week',
    standalone: true,
    templateUrl: './navigator-week.html',
    imports: [Loading],
})
export class NavigatorWeek {
    trackingSvc = inject(PlanTrackingService);
    dateSvc = inject(DateService);
    state = inject(WorkoutStateService);

    tracking = toSignal(this.trackingSvc.trackingPlanVM$);
    readonly loading = this.trackingSvc.loadingWorkout;

    totalDays = 7;
    visibleDayCount = 4;
    currentDayIndex = signal<number>(0);

    workoutDay = this.state.workoutSession();

    selectedDay = computed(() => {
        const day = {
            date: this.state.selectedDate(),
            dayNumber: this.state.selectedDate()?.getDate(),
            day: this.state.selectedDate()?.toLocaleDateString('es-ES', { weekday: 'long' }),
        };
        return day;
    });
    sameDay(day: DayWithString): boolean {
        if (this.selectedDay() === null || this.selectedDay()?.date === null) return false;
        return this.dateSvc.isEqualDate(this.selectedDay()?.date!, day.date);
    }

    allDays = computed(() => {
        const t = this.tracking();
        if (!t) return [];
        return this.dateSvc.daysOfWeek(t.startDate);
    });

    visibleDays = computed(() => {
        return this.allDays().slice(
            this.currentDayIndex(),
            this.currentDayIndex() + this.visibleDayCount,
        );
    });

    constructor() {
        effect(() => {
            const t = this.tracking();
            if (t) {
                this.allDays();
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
        this.state.setDate(day.date);
    }
}
