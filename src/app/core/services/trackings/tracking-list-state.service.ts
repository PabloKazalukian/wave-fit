import { inject, Injectable } from '@angular/core';
import { PlanTrackingService } from './plan-tracking.service';
import { map, Observable, tap } from 'rxjs';
import { TrackingVM } from '../../../shared/interfaces/tracking.interface';

@Injectable({
    providedIn: 'root',
})
export class TrackingListState {
    private planTrackingService = inject(PlanTrackingService);

    readonly trackings$ = this.planTrackingService.findAll();

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
}
