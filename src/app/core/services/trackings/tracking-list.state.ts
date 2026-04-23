import { DestroyRef, inject, Injectable } from '@angular/core';
import { PlanTrackingService } from './plan-tracking.service';
import { map, Observable, startWith, Subject, switchMap, tap } from 'rxjs';
import { TrackingVM } from '../../../shared/interfaces/tracking.interface';

@Injectable({
    providedIn: 'root',
})
export class TrackingListState {
    private planTrackingService = inject(PlanTrackingService);

    private readonly _refresh$ = new Subject<void>();

    readonly trackings$ = this._refresh$.pipe(
        startWith(undefined),
        switchMap(() => this.planTrackingService.findAll()),
    );

    getTrackingById(id: string): Observable<TrackingVM | null> {
        return this.planTrackingService.findById(id);
    }

    getStats() {
        return this.trackings$.pipe(
            tap((trackings) => console.log(trackings)),
            map((trackings: TrackingVM[] | null) => {
                if (!trackings) return { completed: 0, total: 0 };
                return {
                    completed: trackings.filter((t: TrackingVM) => t.completed).length,
                    total: trackings.length,
                };
            }),
        );
    }

    removeTracking(id: string): Observable<boolean> {
        return this.planTrackingService.removeTracking(id);
    }

    resetData(): void {
        this._refresh$.next();
    }
}
