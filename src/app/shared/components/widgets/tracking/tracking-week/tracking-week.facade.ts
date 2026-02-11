import { inject, Injectable } from '@angular/core';
import { PlanTrackingService } from '../../../../../core/services/trackings/plan-tracking.service';

@Injectable({
    providedIn: 'root',
})
export class TrackingWeekFacade {
    // constructor() { }

    trackingSvc = inject(PlanTrackingService);

    trackingPlanVM$ = this.trackingSvc.trackingPlanVM$;

    submit() {}
}
