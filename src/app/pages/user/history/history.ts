import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ChevronLeft, ChevronRight, Calendar } from 'lucide-angular';
import { TrainingHistoryService } from '../../../core/services/training-history/training-history.service';
import {
    CalendarDay,
    CalendarDayType,
    TrainingStatus,
} from '../../../shared/interfaces/training-history.interface';
import { Loading } from '../../../shared/components/ui/loading/loading';

@Component({
    selector: 'app-history',
    imports: [CommonModule, LucideAngularModule, Loading],
    standalone: true,
    templateUrl: './history.html',
    styleUrl: './history.css',
})
export class History {
    private readonly trainingHistorySvc = inject(TrainingHistoryService);

    readonly ChevronLeftIcon = ChevronLeft;
    readonly ChevronRightIcon = ChevronRight;
    readonly CalendarIcon = Calendar;

    private now = new Date();
    currentMonth = signal(this.now.getMonth());
    currentYear = signal(this.now.getFullYear());
    today = signal(this.now.getDate());
    todayMonth = signal(this.now.getMonth());
    todayYear = signal(this.now.getFullYear());

    readonly monthNames = [
        'Enero',
        'Febrero',
        'Marzo',
        'Abril',
        'Mayo',
        'Junio',
        'Julio',
        'Agosto',
        'Septiembre',
        'Octubre',
        'Noviembre',
        'Diciembre',
    ];

    readonly weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    calendarDays = signal<CalendarDay[]>([]);
    loading = signal(false);
    error = signal(false);

    currentMonthName = computed(() => this.monthNames[this.currentMonth()]);

    daysInMonth = computed(() => {
        return new Date(this.currentYear(), this.currentMonth() + 1, 0).getDate();
    });

    firstDayOfWeek = computed(() => {
        const day = new Date(this.currentYear(), this.currentMonth(), 1).getDay();
        return day === 0 ? 6 : day - 1;
    });

    calendarGrid = computed(() => {
        const totalDays = this.daysInMonth();
        const startDay = this.firstDayOfWeek();
        const daysMap = new Map<string, CalendarDay>();

        for (const day of this.calendarDays()) {
            daysMap.set(day.date, day);
        }

        const grid: CalendarDay[] = [];

        for (let i = 0; i < startDay; i++) {
            const d = new Date(this.currentYear(), this.currentMonth(), i - startDay + 1);
            grid.push({
                date: this.formatDate(d),
                type: CalendarDayType.DAY_LOG,
                status: TrainingStatus.NONE,
            });
        }

        for (let i = 1; i <= totalDays; i++) {
            const dateStr = this.formatDate(new Date(this.currentYear(), this.currentMonth(), i));
            const existing = daysMap.get(dateStr);
            if (existing) {
                grid.push(existing);
            } else {
                grid.push({
                    date: dateStr,
                    type: CalendarDayType.DAY_LOG,
                    status: TrainingStatus.NONE,
                });
            }
        }

        while (grid.length % 7 !== 0) {
            const d = new Date(
                this.currentYear(),
                this.currentMonth(),
                totalDays + (grid.length - startDay - totalDays) + 1,
            );
            grid.push({
                date: this.formatDate(d),
                type: CalendarDayType.DAY_LOG,
                status: TrainingStatus.NONE,
            });
        }

        return grid;
    });

    private formatDate(d: Date): string {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    private calendarEffect = effect(() => {
        const year = this.currentYear();
        const month = this.currentMonth();
        this.loadCalendar(year, month);
    });

    private loadCalendar(year: number, month: number) {
        this.loading.set(true);
        this.error.set(false);
        this.trainingHistorySvc.getTrainingCalendar(year, month).subscribe({
            next: (res) => {
                this.calendarDays.set(res.days);
                this.loading.set(false);
            },
            error: () => {
                this.calendarDays.set([]);
                this.loading.set(false);
                this.error.set(true);
            },
        });
    }

    reloadMonth() {
        this.loadCalendar(this.currentYear(), this.currentMonth());
    }

    prevMonth() {
        if (this.currentMonth() === 0) {
            this.currentMonth.set(11);
            this.currentYear.update((y) => y - 1);
        } else {
            this.currentMonth.update((m) => m - 1);
        }
    }

    nextMonth() {
        if (this.currentMonth() === 11) {
            this.currentMonth.set(0);
            this.currentYear.update((y) => y + 1);
        } else {
            this.currentMonth.update((m) => m + 1);
        }
    }

    isToday(day: CalendarDay): boolean {
        const parts = day.date.split('-');
        return (
            parseInt(parts[2], 10) === this.today() &&
            parseInt(parts[1], 10) - 1 === this.todayMonth() &&
            parseInt(parts[0], 10) === this.todayYear()
        );
    }

    isWeekLog(day: CalendarDay): boolean {
        return day.type === CalendarDayType.WEEK_LOG;
    }

    isComplete(day: CalendarDay): boolean {
        return day.status?.toUpperCase() === 'COMPLETE';
    }

    isRest(day: CalendarDay): boolean {
        return day.status?.toUpperCase() === 'REST';
    }

    isPending(day: CalendarDay): boolean {
        return day.status?.toUpperCase() === 'PENDING';
    }

    isNone(day: CalendarDay): boolean {
        return day.status === TrainingStatus.NONE;
    }

    getWrapperClasses(day: CalendarDay): string {
        const base = 'flex items-center justify-center h-11 transition-all duration-200';

        if (this.isWeekLog(day)) {
            const parts = day.date.split('-');
            const dayNum = parseInt(parts[2], 10);
            const totalDays = this.daysInMonth();
            const prevDate = `${this.currentYear()}-${String(this.currentMonth() + 1).padStart(2, '0')}-${String(dayNum - 1).padStart(2, '0')}`;
            const nextDate = `${this.currentYear()}-${String(this.currentMonth() + 1).padStart(2, '0')}-${String(dayNum + 1).padStart(2, '0')}`;
            const prevDay = this.calendarDays().find((d) => d.date === prevDate);
            const nextDay = this.calendarDays().find((d) => d.date === nextDate);
            const isFirst = !prevDay || !this.isWeekLog(prevDay);
            const isLast = dayNum >= totalDays || !nextDay || !this.isWeekLog(nextDay);
            const rounded = isFirst ? 'rounded-l-full' : isLast ? 'rounded-r-full' : '';
            return `${base} bg-accent/15 ${rounded} hover:bg-accent/25 cursor-pointer`;
        }
        return base;
    }

    getDayClasses(day: CalendarDay): string {
        const base =
            'relative flex items-center justify-center w-9 h-9 text-sm transition-all duration-200 rounded-full';

        if (this.isToday(day) && this.isWeekLog(day)) {
            return `${base} border-2 border-accent text-accent font-bold hover:scale-110`;
        }

        if (this.isToday(day)) {
            return `${base} border-2 border-primary text-primary font-bold hover:scale-110`;
        }

        if (this.isWeekLog(day) && this.isRest(day)) {
            return `${base} border border-secondary text-secondary font-medium bg-secondary/10 hover:scale-110`;
        }

        if (this.isWeekLog(day) && this.isComplete(day)) {
            return `${base} border border-primary text-primary font-medium bg-primary/10 hover:scale-110`;
        }

        if (this.isWeekLog(day)) {
            return `${base} border border-accent/40 text-accent/60 font-medium hover:scale-110`;
        }

        if (this.isNone(day)) {
            return `${base} text-text3/30`;
        }

        return `${base} text-text2 hover:bg-white/5 cursor-default`;
    }

    getDayNumber(day: CalendarDay): number {
        return parseInt(day.date.split('-')[2], 10);
    }

    getStatusDotClass(day: CalendarDay): string {
        const size = 'w-1.5 h-1.5 rounded-full absolute -bottom-0.5';
        if (this.isComplete(day)) return `${size} bg-primary`;
        if (this.isRest(day)) return `${size} bg-secondary`;
        if (this.isPending(day)) return `${size} bg-accent/40`;
        return `${size} bg-text2/25`;
    }

    getDayAriaLabel(day: CalendarDay): string {
        const dayNum = this.getDayNumber(day);
        if (this.isNone(day)) {
            return `${dayNum}, sin actividad`;
        }
        const typeLabel = day.type === CalendarDayType.WEEK_LOG ? 'semana' : 'día';
        const statusLabel = this.isComplete(day)
            ? 'completado'
            : this.isRest(day)
              ? 'descanso'
              : 'pendiente';
        return `${dayNum}, ${typeLabel} ${statusLabel}`;
    }
}
