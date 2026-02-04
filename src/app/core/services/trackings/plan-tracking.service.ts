import { inject, Injectable, signal } from '@angular/core';
import { PlanTrankingApi } from './plan-tracking/api/plan-tranking-api.service';
import { PlanTrackingStorage } from './plan-tracking/storage/plan-tracking-storage.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class PlanTracking {
    private trackingSubject = new BehaviorSubject<any | null>(null);
    trackingPlanVM$ = this.trackingSubject.pipe();

    api = inject(PlanTrankingApi);
    storage = inject(PlanTrackingStorage);

    userId = signal<string>('');

    initTracking() {
        if (this.userId() !== '') {
            return;
        }
        const stored = this.storage.getTrackingStorage(this.userId());

        this.userId.set(this.userId());

        if (stored) {
            this.trackingSubject.next(stored);
        } else {
            const initValue = '';
            this.trackingSubject.next(initValue);
            this.storage.setTrackingStorage(initValue, this.userId());
        }
    }
}
