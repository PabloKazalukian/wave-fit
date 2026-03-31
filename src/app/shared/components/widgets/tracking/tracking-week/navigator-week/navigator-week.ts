import { Component, computed, effect, inject, signal } from '@angular/core';
import { DateService } from '../../../../../../core/services/date.service';
import { WorkoutStateService } from '../../../../../../core/services/workouts/workout.state';
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
    readonly loading = this.trackingSvc.loadingWorkoutCreation;

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

    private lastCenteredWeekId: string | null = null;

    constructor() {
        effect(() => {
            const t = this.tracking();
            const days = this.allDays();

            if (t && days.length > 0) {
                // Only auto-center if it's a different week than the last one we centered
                if (t.id !== this.lastCenteredWeekId) {
                    this.lastCenteredWeekId = t.id;

                    const today = this.dateSvc.today();
                    const todayIndex = days.findIndex((d) => this.dateSvc.isEqualDate(d.date, today));

                    if (todayIndex !== -1) {
                        // Center today (offset 2 for 4 visible days -> roughly middle-right)
                        const centerOffset = Math.floor(this.visibleDayCount / 2);
                        const start = Math.max(
                            0,
                            Math.min(todayIndex - centerOffset, days.length - this.visibleDayCount),
                        );
                        this.currentDayIndex.set(start);
                    } else {
                        // If today is not in the week (e.g. historical/future week), start at index 0
                        this.currentDayIndex.set(0);
                    }
                }
            }
        }, { allowSignalWrites: true });
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
