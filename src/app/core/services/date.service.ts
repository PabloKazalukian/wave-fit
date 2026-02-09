import { Injectable } from '@angular/core';
import { addDays, eachDayOfInterval, format, getWeek, isEqual, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

export interface DayWithString {
    day: string;
    dayNumber: number;
    date: Date;
}

@Injectable({ providedIn: 'root' })
export class DateService {
    today(): Date {
        return startOfDay(new Date());
    }

    addDays(date: Date, days: number): Date {
        return addDays(date, days);
    }

    todayPlusDays(days: number): { start: Date; end: Date } {
        const start = this.today();
        const end = this.addDays(start, days);
        return { start, end };
    }

    dateToStringLocal(date: Date): string {
        return format(date, 'dd-MM-yyyy');
    }

    daysOfWeek(startDate: Date, endDate: Date): DayWithString[] {
        return eachDayOfInterval({ start: startDate, end: endDate }).map((date) => ({
            day: format(date, 'EE', { locale: es }),
            dayNumber: parseInt(format(date, 'dd')),
            date,
        }));
    }

    isEqualDate(date1: Date, date2: Date): boolean {
        return isEqual(date1, date2);
    }
}
