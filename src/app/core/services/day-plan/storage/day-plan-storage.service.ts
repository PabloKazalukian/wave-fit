import { Injectable } from '@angular/core';
import { DayPlan } from '../../../../shared/interfaces/routines.interface';

@Injectable({
    providedIn: 'root',
})
export class DayPlanStorageService {
    private storageKey = 'day_plan:';

    getDayPlanStorage(id: string): DayPlan[] | null {
        const data = localStorage.getItem(`${this.storageKey}${id}`);
        return data ? JSON.parse(data) : null;
    }

    setDayPlanStorage(payload: DayPlan[], id: string) {
        localStorage.setItem(`${this.storageKey}${id}`, JSON.stringify(payload));
    }
}
