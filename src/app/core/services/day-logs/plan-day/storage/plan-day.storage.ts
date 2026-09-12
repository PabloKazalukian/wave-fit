import { Injectable } from '@angular/core';
import { DayLogVM } from '../../../../../shared/interfaces/day-log.interface';

@Injectable({
    providedIn: 'root',
})
export class PlanDayStorage {
    private storageKey = 'dayLog:';

    getDayLogStorage(id: string): DayLogVM | null {
        const data = localStorage.getItem(`${this.storageKey}${id}`);
        return data ? JSON.parse(data) : null;
    }

    setDayLogStorage(payload: DayLogVM, id: string) {
        localStorage.setItem(`${this.storageKey}${id}`, JSON.stringify(payload));
    }

    removeDayLogStorage(id: string) {
        localStorage.removeItem(`${this.storageKey}${id}`);
    }
}
