import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { LucideAngularModule, Calendar } from 'lucide-angular';
import { switchMap } from 'rxjs';
import { TrainingHistoryService } from '../../../core/services/training-history/training-history.service';
import { PlanTrackingService } from '../../../core/services/trackings/plan-tracking.service';
import { PlanDayService } from '../../../core/services/day-logs/plan-day.service';
import { ExercisesService } from '../../../core/services/exercises/exercises.service';
import {
    CalendarDay,
    CalendarDayType,
    DayPreview,
    TrainingStatus,
} from '../../../shared/interfaces/training-history.interface';
import { TrainingHistoryCalendar } from '../../../shared/components/widgets/training-history/calendar/calendar';
import { TrainingHistoryDayPreview } from '../../../shared/components/widgets/training-history/day-detail-preview/day-detail-preview';

@Component({
    selector: 'app-history',
    imports: [LucideAngularModule, TrainingHistoryCalendar, TrainingHistoryDayPreview],
    standalone: true,
    templateUrl: './history.html',
    styleUrl: './history.css',
})
export class History implements OnInit {
    private readonly trainingHistorySvc = inject(TrainingHistoryService);
    private readonly planTrackingSvc = inject(PlanTrackingService);
    private readonly planDaySvc = inject(PlanDayService);
    private readonly exerciseSvc = inject(ExercisesService);

    readonly CalendarIcon = Calendar;

    private now = new Date();
    currentMonth = signal(this.now.getMonth());
    currentYear = signal(this.now.getFullYear());

    calendarDays = signal<CalendarDay[]>([]);
    loading = signal(false);
    error = signal(false);

    selectedDay = signal<CalendarDay | null>(null);
    selectedDate = computed(() => this.selectedDay()?.date ?? null);
    preview = signal<DayPreview | null>(null);
    previewLoading = signal(false);
    previewError = signal(false);

    ngOnInit() {
        this.loadCalendar(this.currentYear(), this.currentMonth());
    }

    private loadCalendar(year: number, month: number) {
        this.loading.set(true);
        this.error.set(false);
        this.trainingHistorySvc.getTrainingCalendar(year, month).subscribe({
            next: (res) => {
                this.calendarDays.set(res.days);
                this.loading.set(false);
                this.closePreview();
            },
            error: () => {
                this.calendarDays.set([]);
                this.loading.set(false);
                this.error.set(true);
                this.closePreview();
            },
        });
    }

    reloadMonth() {
        this.loadCalendar(this.currentYear(), this.currentMonth());
    }

    prevMonth() {
        this.closePreview();
        if (this.currentMonth() === 0) {
            this.currentMonth.set(11);
            this.currentYear.update((y) => y - 1);
        } else {
            this.currentMonth.update((m) => m - 1);
        }
        this.loadCalendar(this.currentYear(), this.currentMonth());
    }

    nextMonth() {
        this.closePreview();
        if (this.currentMonth() === 11) {
            this.currentMonth.set(0);
            this.currentYear.update((y) => y + 1);
        } else {
            this.currentMonth.update((m) => m + 1);
        }
        this.loadCalendar(this.currentYear(), this.currentMonth());
    }

    onDayClick(day: CalendarDay) {
        if (this.previewLoading()) return;

        if (this.selectedDate() === day.date && this.preview()) {
            this.closePreview();
            return;
        }

        if (day.type === CalendarDayType.WEEK_LOG) {
            const reference = day.weekLogReference;
            if (day.status === TrainingStatus.REST || !reference?.id) {
                this.closePreview();
                return;
            }
            this.select(day);
            this.loadWeekPreview(day.date, reference.id);
            return;
        }

        if (day.type === CalendarDayType.DAY_LOG) {
            if (!day.dayLogId) {
                this.closePreview();
                return;
            }
            this.select(day);
            this.loadDayPreview(day.dayLogId);
            return;
        }

        this.closePreview();
    }

    retryPreview() {
        const day = this.selectedDay();
        if (!day) return;
        this.onDayClick(day);
    }

    private select(day: CalendarDay) {
        this.selectedDay.set(day);
        this.preview.set(null);
        this.previewError.set(false);
        this.previewLoading.set(true);
    }

    private closePreview() {
        this.selectedDay.set(null);
        this.preview.set(null);
        this.previewLoading.set(false);
        this.previewError.set(false);
    }

    private loadWeekPreview(date: string, weekId: string) {
        this.exerciseSvc
            .getExercises()
            .pipe(switchMap(() => this.planTrackingSvc.findById(weekId)))
            .subscribe({
                next: (tracking) => {
                    if (!tracking) {
                        this.failPreview();
                        return;
                    }
                    const workout = tracking.workouts?.find((w) => w.date === date);
                    if (!workout || workout.exercises.length === 0) {
                        this.closePreview();
                        return;
                    }
                    this.preview.set({
                        kind: CalendarDayType.WEEK_LOG,
                        id: tracking.id,
                        date,
                        exercises: workout.exercises,
                        active: this.selectedDay()?.weekLogReference?.active ?? false,
                    });
                    this.previewLoading.set(false);
                },
                error: () => this.failPreview(),
            });
    }

    private loadDayPreview(dayLogId: string) {
        this.exerciseSvc
            .getExercises()
            .pipe(switchMap(() => this.planDaySvc.findById(dayLogId)))
            .subscribe({
                next: (dayLog) => {
                    if (!dayLog || !dayLog.exercises?.length) {
                        this.closePreview();
                        return;
                    }
                    this.preview.set({
                        kind: CalendarDayType.DAY_LOG,
                        id: dayLog.id,
                        date: dayLog.date,
                        exercises: dayLog.exercises,
                    });
                    this.previewLoading.set(false);
                },
                error: () => this.failPreview(),
            });
    }

    private failPreview() {
        this.preview.set(null);
        this.previewLoading.set(false);
        this.previewError.set(true);
    }
}
