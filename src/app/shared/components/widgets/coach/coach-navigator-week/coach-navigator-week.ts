import { Component, computed, inject, input, signal } from '@angular/core';
import { DateService } from '../../../../../core/services/date.service';
import { DayWithState } from '../../tracking/tracking-week/navigator-week/navigator-week';
import { LocalDate, TrackingVM, WorkoutSessionVM } from '../../../../interfaces/tracking.interface';
import { Loading } from '../../../ui/loading/loading';

@Component({
    selector: 'app-coach-navigator-week',
    imports: [Loading],
    templateUrl: './coach-navigator-week.html',
    styles: ``,
})
export class CoachNavigatorWeek {
    // trackingSvc = inject(PlanTrackingService);
    dateSvc = inject(DateService);
    // state = inject(WorkoutStateService);

    tracking = input.required<TrackingVM>();
    // readonly loading = this.trackingSvc.loadingWorkoutCreation;

    totalDays = 7;
    visibleDayCount = 4;
    currentDayIndex = signal<number>(0);

    //Debe ser el seleccionado
    workoutDay = signal<WorkoutSessionVM | null>(null);
    loading = signal<{ date: LocalDate; state: boolean }>({
        date: '', // LocalDate vacío inicial
        state: false,
    });
    selectedDate = signal<LocalDate | null>(null);

    // selectedDay = signal<LocalDate | null>(null);
    selectedDay = computed(() => {
        const selected = this.selectedDate();
        if (!selected) return null;

        const day: DayWithState = {
            date: selected,
            dayNumber: this.dateSvc.localDateToDisplay(selected).getDate(),
            day: this.dateSvc.dateToStringLocalWithDay(selected),
            state: this.workoutDay()?.status ?? 'not_started',
            hasExtra: !!this.workoutDay()?.extras?.length,
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
                hasExtra: !!w.extras?.length,
            };
        });
    });

    visibleDays = computed(() => {
        return this.allDays().slice(
            this.currentDayIndex(),
            this.currentDayIndex() + this.visibleDayCount,
        );
    });

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
        this.selectedDate.set(day.date);

        if (!this.tracking() || this.tracking().workouts === undefined) return;

        const workout = this.tracking()!.workouts!.find((w) => w.date === day.date);
        if (workout) {
            this.workoutDay.set(workout);
        } else {
            this.workoutDay.set(null);
        }

        // this.setDate(day.date);
    }
}
