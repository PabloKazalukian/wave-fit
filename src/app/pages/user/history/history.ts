import { CommonModule } from '@angular/common';
import { Component, signal, computed } from '@angular/core';
import {
    LucideAngularModule,
    ChevronLeft,
    ChevronRight,
    Calendar,
} from 'lucide-angular';

@Component({
    selector: 'app-history',
    imports: [CommonModule, LucideAngularModule],
    standalone: true,
    templateUrl: './history.html',
    styleUrl: './history.css',
})
export class History {
    readonly ChevronLeftIcon = ChevronLeft;
    readonly ChevronRightIcon = ChevronRight;
    readonly CalendarIcon = Calendar;

    readonly weekLogDays = [1, 2, 3, 4, 5, 6, 7];

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

    currentMonthName = computed(() => this.monthNames[this.currentMonth()]);

    daysInMonth = computed(() => {
        return new Date(this.currentYear(), this.currentMonth() + 1, 0).getDate();
    });

    firstDayOfWeek = computed(() => {
        const day = new Date(this.currentYear(), this.currentMonth(), 1).getDay();
        return day === 0 ? 6 : day - 1;
    });

    calendarDays = computed(() => {
        const totalDays = this.daysInMonth();
        const startDay = this.firstDayOfWeek();
        const days: (number | null)[] = [];

        for (let i = 0; i < startDay; i++) {
            days.push(null);
        }

        for (let i = 1; i <= totalDays; i++) {
            days.push(i);
        }

        while (days.length < 42) {
            days.push(null);
        }

        return days;
    });

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

    isToday(day: number): boolean {
        return (
            day === this.today() &&
            this.currentMonth() === this.todayMonth() &&
            this.currentYear() === this.todayYear()
        );
    }

    isWeekLog(day: number): boolean {
        return this.weekLogDays.includes(day);
    }

    getWrapperClasses(day: number | null): string {
        const base = 'flex items-center justify-center h-11';
        if (day === null) return base;

        if (this.isWeekLog(day)) {
            const isFirst = day === 1;
            const isLast = day === 7;
            const rounded = isFirst ? 'rounded-l-full' : isLast ? 'rounded-r-full' : '';
            return `${base} bg-accent/15 ${rounded}`;
        }
        return base;
    }

    getDayClasses(day: number | null): string {
        if (day === null) return '';

        const base = 'relative flex items-center justify-center w-9 h-9 text-sm transition-all duration-200 rounded-full';

        if (this.isToday(day) && this.isWeekLog(day)) {
            return `${base} border-2 border-accent text-accent font-bold`;
        }

        if (this.isToday(day)) {
            return `${base} border-2 border-primary text-primary font-bold`;
        }

        if (this.isWeekLog(day)) {
            return `${base} border border-accent text-accent font-medium`;
        }

        return `${base} text-text2 hover:bg-white/5 cursor-default`;
    }
}
