import { Injectable } from '@angular/core';
import { TrackingVM } from '../../../../../shared/interfaces/tracking.interface';

@Injectable({
    providedIn: 'root',
})
export class PlanTrackingStorage {
    private storageKey = 'tracking:';

    getTrackingStorage(id: string): TrackingVM | null {
        const data = localStorage.getItem(`${this.storageKey}${id}`);
        return data ? JSON.parse(data) : null;
    }

    setTrackingStorage(payload: TrackingVM, id: string) {
        console.log(payload);
        localStorage.setItem(`${this.storageKey}${id}`, JSON.stringify(payload));
    }

    removeTrackingStorage(id: string) {
        localStorage.removeItem(`${this.storageKey}${id}`);
    }
}
