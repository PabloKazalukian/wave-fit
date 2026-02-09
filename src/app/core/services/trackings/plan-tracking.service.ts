import { inject, Injectable, signal } from '@angular/core';
import { PlanTrankingApi } from './plan-tracking/api/plan-tranking-api.service';
import { PlanTrackingStorage } from './plan-tracking/storage/plan-tracking-storage.service';
import { BehaviorSubject, filter, map, Observable, tap } from 'rxjs';
import {
    Tracking,
    TrackingCreate,
    TrackingVM,
    WorkoutSessionVM,
} from '../../../shared/interfaces/tracking.interface';
import { DateService } from '../date.service';

@Injectable({
    providedIn: 'root',
})
export class PlanTrackingService {
    private trackingSubject = new BehaviorSubject<TrackingVM | null>(null);
    trackingPlanVM$ = this.trackingSubject.pipe(filter((v): v is TrackingVM => v !== null));

    api = inject(PlanTrankingApi);
    storage = inject(PlanTrackingStorage);
    dateService = inject(DateService);

    userId = signal<string>('');

    initTracking(userId: string) {
        if (this.userId() !== '') {
            return;
        }

        this.userId.set(userId);
        const stored = this.storage.getTrackingStorage(this.userId());

        if (stored) {
            this.trackingSubject.next(stored);
        } else {
            // const initValue = '';
            this.api.getTrackingByUser().subscribe((res) => {
                if (!res) {
                    return;
                }
                // if(res?.workouts?.length === 0) {res.workouts = this.createWorkouts(res);}
                const payload = this.wrappedTrackingToTrackingVM(res);
                this.trackingSubject.next(payload);
                this.storage.setTrackingStorage(payload, this.userId());
            });
        }
    }

    createTracking(): Observable<TrackingVM | null | undefined> {
        const { start, end } = this.dateService.todayPlusDays(7);

        const payload: TrackingCreate = {
            startDate: start,
            endDate: end,
            completed: false,
            // planId: this.userId(),
        };

        return this.api.createTracking(payload).pipe(
            tap((res) => {
                if (res !== undefined && res !== null) {
                    const payload = this.wrappedTrackingToTrackingVM(res);
                    this.storage.setTrackingStorage(payload, this.userId());
                    this.trackingSubject.next(payload);
                }
            }),
            map((res) => this.trackingSubject.value),
        );
    }

    createWorkouts(tracking: Tracking): WorkoutSessionVM[] {
        return this.dateService.daysOfWeek(tracking.startDate, tracking.endDate).map((day) => ({
            date: day.date,
            exercises: [],
        }));
    }

    wrappedTrackingToTrackingVM(tracking: Tracking): TrackingVM {
        return {
            ...tracking,
            workouts: this.createWorkouts(tracking),
        };
    }

    setTracking(tracking: TrackingVM) {
        this.trackingSubject.next(tracking);
        this.storage.setTrackingStorage(tracking, this.userId());
    }

    setWorkouts(tracking: TrackingVM) {
        this.trackingSubject.next(tracking);
    }
}
