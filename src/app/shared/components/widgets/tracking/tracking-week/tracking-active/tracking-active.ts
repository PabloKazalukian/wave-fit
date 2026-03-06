import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlanTrackingService } from '../../../../../../core/services/trackings/plan-tracking.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { BtnComponent } from '../../../../ui/btn/btn';

@Component({
    selector: 'app-tracking-active',
    standalone: true,
    imports: [CommonModule, BtnComponent],
    templateUrl: './tracking-active.html',
})
export class TrackingActiveComponent {
    private trackingSvc = inject(PlanTrackingService);
    private tracking = toSignal(this.trackingSvc.trackingPlanVM$);

    get weekActive(): boolean {
        return !!(this.tracking() as any);
    }
}
