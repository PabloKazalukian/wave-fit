import { Component, inject, OnInit } from '@angular/core';
import { BtnComponent } from '../../../shared/components/ui/btn/btn';
import { WaveLogoTextComponent } from '../../../shared/components/ui/logos/wave-logo-text/wave-logo-text';
import { WeeklyTrackings } from '../../../shared/components/widgets/users/weekly-trackings/weekly-trackings';
import { TrackingListState } from '../../../core/services/trackings/tracking-list.state';

@Component({
    selector: 'app-success',
    imports: [BtnComponent, WaveLogoTextComponent, WeeklyTrackings],
    standalone: true,
    templateUrl: './success.html',
    styles: ``,
})
export class Success implements OnInit {
    private facade = inject(TrackingListState);

    ngOnInit(): void {
        this.facade.getStats();
    }
}
