import { Component, computed, effect, inject, signal } from '@angular/core';
import { DateService } from '../../../../../../core/services/date.service';
import { WorkoutStateService } from '../../../../../../core/services/workouts/workout-state.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { PlanTrackingService } from '../../../../../../core/services/trackings/plan-tracking.service';
import { Loading } from '../../../../ui/loading/loading';
import { StatusWorkoutSession } from '../../../../../interfaces/tracking.interface';

interface DayWithState {
    day: string;
    dayNumber: number;
    date: Date;
    state: StatusWorkoutSession;
}

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
            dayNumber: this.dateSvc.dateToNumber(this.state.selectedDate()!),
            day: this.dateSvc.dateToStringLocalWithDay(this.state.selectedDate()!),
        };
        return day;
    });
    sameDay(day: DayWithState): boolean {
        if (this.selectedDay() === null || this.selectedDay()?.date === null) return false;
        return this.dateSvc.isEqualDate(this.selectedDay()?.date!, day.date);
    }

    allDays = computed(() => {
        const t = this.tracking();
        if (!t || !t.workouts) return [];
        return t.workouts.map((w) => {
            return {
                date: w.date,
                dayNumber: this.dateSvc.dateToNumber(w.date),
                day: this.dateSvc.dateToStringLocalWithDay(w.date),
                state: w.status,
            };
        });
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

    selectDay(day: DayWithState): void {
        this.state.setDate(day.date);
    }
}
