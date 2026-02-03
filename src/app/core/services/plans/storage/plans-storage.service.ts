import { Injectable } from '@angular/core';
import { RoutinePlanVM } from '../../../../shared/interfaces/routines.interface';

@Injectable({
    providedIn: 'root',
})
export class PlansStorageService {
    private storageKey = 'routine_plan:';

    getPlanStorage(id: string): RoutinePlanVM | null {
        const data = localStorage.getItem(`${this.storageKey}${id}`);
        return data ? JSON.parse(data) : null;
    }

    setPlanStorage(payload: RoutinePlanVM, id: string) {
        localStorage.setItem(`${this.storageKey}${id}`, JSON.stringify(payload));
    }
}
