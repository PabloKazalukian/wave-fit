import { Component, computed, effect, inject, signal } from '@angular/core';
import { DateService } from '../../../../../../core/services/date.service';
import { WorkoutStateService } from '../../../../../../core/services/workouts/workout.state';
import { toSignal } from '@angular/core/rxjs-interop';
import { PlanTrackingService } from '../../../../../../core/services/trackings/plan-tracking.service';
import { Loading } from '../../../../ui/loading/loading';
import { LocalDate, StatusWorkoutSession } from '../../../../../interfaces/tracking.interface';

interface DayWithState {
    day: string;
    dayNumber: number;
    date: LocalDate;
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
    readonly loading = this.trackingSvc.loadingWorkoutCreation;

    totalDays = 7;
    visibleDayCount = 4;
    currentDayIndex = signal<number>(0);

    workoutDay = this.state.workoutSession;

    selectedDay = computed(() => {
        const selected = this.state.selectedDate();
        if (!selected) return null;

        const day: DayWithState = {
            date: selected,
            dayNumber: this.dateSvc.localDateToDisplay(selected).getDate(),
            day: this.dateSvc.dateToStringLocalWithDay(selected),
            state: this.workoutDay()?.status ?? 'not_started',
        };
        return day;
    });

    sameDay(day: DayWithState): boolean {
        if (!this.selectedDay() || !this.selectedDay()?.date) return false;
        return this.dateSvc.isSameLocalDate(this.selectedDay()!.date, day.date);
    }

    allDays = computed(() => {
        const t = this.tracking();
        if (!t || !t.workouts) return [];
        return t.workouts.map((w) => {
            return {
                date: w.date,
                dayNumber: this.dateSvc.localDateToDisplay(w.date).getDate(),
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

    private lastCenteredWeekId: string | null = null;

    constructor() {
        effect(() => {
            const t = this.tracking();
            const days = this.allDays();

            if (t && days.length > 0 && t.id !== this.lastCenteredWeekId) {
                this.lastCenteredWeekId = t.id;
                this.currentDayIndex.set(this.calculateStartIndex(days));
            }
        });
    }

    private calculateStartIndex(days: DayWithState[]) {
        const today = this.dateSvc.todayLocalDate();
        const todayIndex = days.findIndex((d) => this.dateSvc.isSameLocalDate(d.date, today));

        if (todayIndex === -1) return 0;

        const centerOffset = Math.floor(this.visibleDayCount / 2);

        return Math.max(0, Math.min(todayIndex - centerOffset, days.length - this.visibleDayCount));
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
