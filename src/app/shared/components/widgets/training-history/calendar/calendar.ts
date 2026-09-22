import { Component, computed, input, output, signal } from '@angular/core';
import { LucideAngularModule, ChevronLeft, ChevronRight } from 'lucide-angular';
import {
    CalendarDay,
    CalendarDayType,
    TrainingStatus,
} from '../../../../interfaces/training-history.interface';
import { Loading } from '../../../ui/loading/loading';

@Component({
    selector: 'app-training-history-calendar',
    imports: [LucideAngularModule, Loading],
    standalone: true,
    templateUrl: './calendar.html',
    styles: [':host { display: block; }'],
})
export class TrainingHistoryCalendar {
    days = input<CalendarDay[]>([]);
    year = input<number>(0);
    month = input<number>(0); // 0-based
    selectedDate = input<string | null>(null);
    loading = input(false);
    error = input(false);

    readonly daySelected = output<CalendarDay>();
    readonly previousMonth = output<void>();
    readonly nextMonth = output<void>();
    readonly reload = output<void>();

    readonly ChevronLeftIcon = ChevronLeft;
    readonly ChevronRightIcon = ChevronRight;

    private now = new Date();
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

    currentMonthName = computed(() => this.monthNames[this.month()]);

    daysInMonth = computed(() => {
        return new Date(this.year(), this.month() + 1, 0).getDate();
    });

    firstDayOfWeek = computed(() => {
        const day = new Date(this.year(), this.month(), 1).getDay();
        return day === 0 ? 6 : day - 1;
    });

    calendarGrid = computed(() => {
        const totalDays = this.daysInMonth();
        const startDay = this.firstDayOfWeek();
        const daysMap = new Map<string, CalendarDay>();

        for (const day of this.days()) {
            daysMap.set(day.date, day);
        }

        const grid: CalendarDay[] = [];

        for (let i = 0; i < startDay; i++) {
            const d = new Date(this.year(), this.month(), i - startDay + 1);
            grid.push({
                date: this.formatDate(d),
                type: CalendarDayType.DAY_LOG,
                status: TrainingStatus.NONE,
            });
        }

        for (let i = 1; i <= totalDays; i++) {
            const dateStr = this.formatDate(new Date(this.year(), this.month(), i));
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
                this.year(),
                this.month(),
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

    onTileClick(day: CalendarDay) {
        this.daySelected.emit(day);
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

    isClickable(day: CalendarDay): boolean {
        if (day.type === CalendarDayType.WEEK_LOG) {
            if (!day.weekLogReference?.id) return false;
            return day.status !== TrainingStatus.REST || !!day.extraSessions?.length;
        }
        if (day.type === CalendarDayType.DAY_LOG) {
            return !!day.dayLogId || !!day.extraSessions?.length;
        }
        return false;
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
        const selected = this.selectedDate() === day.date ? ' ring-1 ring-primary/70' : '';

        if (this.isWeekLog(day)) {
            const parts = day.date.split('-');
            const dayNum = parseInt(parts[2], 10);
            const totalDays = this.daysInMonth();
            const prevDate = `${this.year()}-${String(this.month() + 1).padStart(2, '0')}-${String(dayNum - 1).padStart(2, '0')}`;
            const nextDate = `${this.year()}-${String(this.month() + 1).padStart(2, '0')}-${String(dayNum + 1).padStart(2, '0')}`;
            const prevDay = this.days().find((d) => d.date === prevDate);
            const nextDay = this.days().find((d) => d.date === nextDate);
            const isFirst = !prevDay || !this.isWeekLog(prevDay);
            const isLast = dayNum >= totalDays || !nextDay || !this.isWeekLog(nextDay);
            const rounded = isFirst ? 'rounded-l-full' : isLast ? 'rounded-r-full' : '';
            const cursor = this.isClickable(day) ? ' cursor-pointer hover:bg-accent/25' : '';
            return `${base} bg-accent/15 ${rounded}${cursor}${selected}`;
        }

        const dayCursor = this.isClickable(day) ? ' cursor-pointer hover:bg-white/5' : '';
        return `${base}${dayCursor}${selected}`;
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
