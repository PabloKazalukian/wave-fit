import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActiveTrackingService } from '../../../../../../core/services/trackings/active-tracking.service';
import { BtnComponent } from '../../../../ui/btn/btn';

@Component({
    selector: 'app-tracking-active',
    standalone: true,
    imports: [CommonModule, BtnComponent],
    templateUrl: './tracking-active.html',
})
export class TrackingActiveComponent {
    private activeTrackingSvc = inject(ActiveTrackingService);

    readonly activeLoading = this.activeTrackingSvc.loading;
    readonly activeReady = this.activeTrackingSvc.ready;

    readonly active = computed(() => this.activeTrackingSvc.hasActive());
    readonly isDayActive = computed(() => this.activeTrackingSvc.isDayLogActive());
    readonly isWeekActive = computed(() => this.activeTrackingSvc.isWeekLogActive());
}
