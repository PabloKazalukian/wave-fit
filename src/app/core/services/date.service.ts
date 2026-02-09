import { Injectable } from '@angular/core';
import { addDays, startOfDay } from 'date-fns';

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
}
