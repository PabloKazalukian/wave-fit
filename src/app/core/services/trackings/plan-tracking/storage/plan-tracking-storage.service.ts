import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class PlanTrackingStorage {
    private storageKey = 'tracking:';

    getTrackingStorage(id: string): any | null {
        const data = localStorage.getItem(`${this.storageKey}${id}`);
        return data ? JSON.parse(data) : null;
    }

    setTrackingStorage(payload: any, id: string) {
        localStorage.setItem(`${this.storageKey}${id}`, JSON.stringify(payload));
    }

    removeTrackingStorage(id: string) {
        localStorage.removeItem(`${this.storageKey}${id}`);
    }
}
