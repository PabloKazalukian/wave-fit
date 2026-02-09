import { inject, Injectable, signal } from '@angular/core';
import { PlanTrankingApi } from './plan-tracking/api/plan-tranking-api.service';
import { PlanTrackingStorage } from './plan-tracking/storage/plan-tracking-storage.service';
import { BehaviorSubject, filter, Observable, tap } from 'rxjs';
import { Tracking, TrackingCreate } from '../../../shared/interfaces/tracking.interface';
import { DateService } from '../date.service';

@Injectable({
    providedIn: 'root',
})
export class PlanTrackingService {
    private trackingSubject = new BehaviorSubject<any | null>(null);
    trackingPlanVM$ = this.trackingSubject.pipe(filter((v): v is Tracking => v !== null));

    api = inject(PlanTrankingApi);
    storage = inject(PlanTrackingStorage);
    dateService = inject(DateService);

    userId = signal<string>('');

    initTracking(userId: string) {
        if (this.userId() !== '') {
            return;
        }
        const stored = this.storage.getTrackingStorage(this.userId());

        this.userId.set(userId);

        if (stored) {
            this.trackingSubject.next(stored);
        } else {
            // const initValue = '';
            this.api.getTrackingByUser().subscribe((res) => {
                this.trackingSubject.next(res);
                this.storage.setTrackingStorage(res, this.userId());
            });
        }
    }

    createTracking(): Observable<Tracking | null | undefined> {
        const { start, end } = this.dateService.todayPlusDays(7);

        const payload: TrackingCreate = {
            startDate: start,
            endDate: end,
            completed: false,
            // planId: this.userId(),
        };

        return this.api.createTracking(payload).pipe(
            tap((res) => {
                this.storage.setTrackingStorage(res, this.userId());
                this.trackingSubject.next(res);
            }),
        );
    }
}
