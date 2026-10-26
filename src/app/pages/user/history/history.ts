import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { LucideAngularModule, Calendar, CalendarClock, CalendarX } from 'lucide-angular';
import { switchMap } from 'rxjs';
import { TrainingHistoryService } from '../../../core/services/training-history/training-history.service';
import { PlanTrackingService } from '../../../core/services/trackings/plan-tracking.service';
import { PlanDayService } from '../../../core/services/day-logs/plan-day.service';
import { ExercisesService } from '../../../core/services/exercises/exercises.service';
import { ExtraSessionService } from '../../../core/services/extra-session/extra-session.service';
import { DateService } from '../../../core/services/date.service';
import {
    CalendarDay,
    CalendarDayType,
    DayPreview,
    TrainingStatus,
} from '../../../shared/interfaces/training-history.interface';
import { TrainingHistoryCalendar } from '../../../shared/components/widgets/training-history/calendar/calendar';
import { TrainingHistoryDayPreview } from '../../../shared/components/widgets/training-history/day-detail-preview/day-detail-preview';
import { BtnComponent } from '../../../shared/components/ui/btn/btn';
import { InfoCard } from '../../../shared/components/ui/info-card/info-card';
import type { InfoCardLine } from '../../../shared/components/ui/info-card/info-card';
import { Notification } from '../../../shared/components/ui/notification/notification';

@Component({
    selector: 'app-history',
    imports: [
        LucideAngularModule,
        TrainingHistoryCalendar,
        TrainingHistoryDayPreview,
        BtnComponent,
        InfoCard,
        Notification,
    ],
    standalone: true,
    templateUrl: './history.html',
    styleUrl: './history.css',
})
export class History implements OnInit {
    private readonly trainingHistorySvc = inject(TrainingHistoryService);
    private readonly planTrackingSvc = inject(PlanTrackingService);
    private readonly planDaySvc = inject(PlanDayService);
    private readonly exerciseSvc = inject(ExercisesService);
    private readonly extraSessionSvc = inject(ExtraSessionService);
    private readonly dateSvc = inject(DateService);

    readonly CalendarIcon = Calendar;

    private readonly today = this.dateSvc.todayLocalDate();

    readonly emptyDayInfo: InfoCardLine[] = [
        {
            icon: CalendarX,
            text: 'No hay datos en este día. ¿Querés agregar uno?',
        },
        {
            icon: CalendarClock,
            text: 'Podés agregarlo de forma diferida y completarlo cuando quieras.',
        },
    ];

    catalog = toSignal(this.extraSessionSvc.catalog$, { initialValue: [] });

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

    creatingDeferred = signal(false);
    notification = signal<{ message: string; type: 'success' | 'error' } | null>(null);

    canAddDeferred = computed(() => {
        const day = this.selectedDay();
        if (!day) return false;
        return day.type !== CalendarDayType.WEEK_LOG && !day.dayLogId && this.isPastDate(day.date);
    });

    isEmptySelection = computed(() => {
        if (!this.canAddDeferred()) return false;
        return !this.preview() && !this.previewLoading() && !this.previewError();
    });

    ngOnInit() {
        this.extraSessionSvc.loadCatalog();
        this.loadCalendar(this.currentYear(), this.currentMonth());
    }

    private isPastDate(date: string): boolean {
        return date < this.today;
    }

    addDeferredDay() {
        const day = this.selectedDay();
        if (!day || this.creatingDeferred()) return;

        this.creatingDeferred.set(true);
        const date = day.date;

        this.planDaySvc.createDayLogDeferred(date).subscribe({
            next: (created) => {
                if (!created) {
                    this.creatingDeferred.set(false);
                    this.notify('No se pudo crear el día', 'error');
                    return;
                }
                this.notify('Día creado correctamente', 'success');
                this.loadCalendar(this.currentYear(), this.currentMonth(), date, created.id, () =>
                    this.creatingDeferred.set(false),
                );
            },
            error: () => {
                this.creatingDeferred.set(false);
                this.notify('No se pudo crear el día', 'error');
            },
        });
    }

    private notify(message: string, type: 'success' | 'error') {
        this.notification.set({ message, type });
    }

    private loadCalendar(
        year: number,
        month: number,
        selectDate?: string,
        fallbackDayLogId?: string,
        onComplete?: () => void,
    ) {
        this.loading.set(true);
        this.error.set(false);
        this.trainingHistorySvc.getTrainingCalendar(year, month).subscribe({
            next: (res) => {
                this.calendarDays.set(res.days);
                this.loading.set(false);
                this.closePreview();
                if (selectDate) {
                    this.openDay(this.findDay(res.days, selectDate, fallbackDayLogId));
                }
                onComplete?.();
            },
            error: () => {
                this.calendarDays.set([]);
                this.loading.set(false);
                this.error.set(true);
                this.closePreview();
                onComplete?.();
            },
        });
    }

    private findDay(days: CalendarDay[], date: string, fallbackDayLogId?: string): CalendarDay {
        const found = days.find((day) => day.date === date);
        if (found) {
            if (!found.dayLogId && fallbackDayLogId) {
                return { ...found, dayLogId: fallbackDayLogId };
            }
            return found;
        }

        return {
            date,
            type: CalendarDayType.DAY_LOG,
            status: TrainingStatus.NONE,
            ...(fallbackDayLogId ? { dayLogId: fallbackDayLogId } : {}),
        };
    }

    private isDayInDisplayedMonth(day: CalendarDay): boolean {
        const [year, month] = day.date.split('-').map((part) => parseInt(part, 10));
        return year === this.currentYear() && month - 1 === this.currentMonth();
    }

    private goToMonthOfDay(day: CalendarDay) {
        const [year, month] = day.date.split('-').map((part) => parseInt(part, 10));
        this.currentYear.set(year);
        this.currentMonth.set(month - 1);
        this.loadCalendar(year, month - 1, day.date);
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
        if (!this.isDayInDisplayedMonth(day)) {
            this.goToMonthOfDay(day);
            return;
        }

        if (this.previewLoading()) return;

        if (this.selectedDate() === day.date) {
            this.closePreview();
            return;
        }

        this.openDay(day);
    }

    retryPreview() {
        const day = this.selectedDay();
        if (!day) return;
        this.openDay(day);
    }

    private openDay(day: CalendarDay) {
        this.selectedDay.set(day);
        this.preview.set(null);
        this.previewError.set(false);
        this.previewLoading.set(true);
        this.resolvePreview(day);
    }

    private resolvePreview(day: CalendarDay) {
        if (day.type === CalendarDayType.WEEK_LOG) {
            const reference = day.weekLogReference;
            const hasExtras = !!day.extraSessions?.length;
            if (!reference?.id || (day.status === TrainingStatus.REST && !hasExtras)) {
                this.clearPreviewOnly();
                return;
            }
            this.loadWeekPreview(day.date, reference.id);
            return;
        }

        if (day.dayLogId) {
            this.loadDayPreview(day.dayLogId);
            return;
        }

        if (day.extraSessions?.length) {
            this.showExtrasOnlyPreview(day);
            return;
        }

        this.clearPreviewOnly();
    }

    private clearPreviewOnly() {
        this.preview.set(null);
        this.previewLoading.set(false);
        this.previewError.set(false);
    }

    private closePreview() {
        this.selectedDay.set(null);
        this.clearPreviewOnly();
    }

    private showExtrasOnlyPreview(day: CalendarDay) {
        this.preview.set({
            kind: CalendarDayType.DAY_LOG,
            id: '',
            date: day.date,
            exercises: [],
            extraSessions: day.extraSessions ?? [],
        });
        this.previewLoading.set(false);
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
                    const extras = this.selectedDay()?.extraSessions ?? [];
                    const workout = tracking.workouts?.find((w) => w.date === date);
                    if (!workout && extras.length === 0) {
                        this.clearPreviewOnly();
                        return;
                    }
                    if (workout && workout.exercises.length === 0 && extras.length === 0) {
                        this.clearPreviewOnly();
                        return;
                    }
                    this.preview.set({
                        kind: CalendarDayType.WEEK_LOG,
                        id: tracking.id,
                        date,
                        exercises: workout?.exercises ?? [],
                        extraSessions: extras,
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
                    const extras = this.selectedDay()?.extraSessions ?? [];
                    if (!dayLog) {
                        this.failPreview();
                        return;
                    }
                    // Un day-log con id siempre abre el preview (aunque esté vacío):
                    // es el estado del día recién creado de forma diferida.
                    this.preview.set({
                        kind: CalendarDayType.DAY_LOG,
                        id: dayLog.id,
                        date: dayLog.date,
                        exercises: dayLog.exercises ?? [],
                        extraSessions: extras,
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
