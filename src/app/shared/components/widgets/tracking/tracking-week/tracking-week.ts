import { Component, effect, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TrackingVM } from '../../../../interfaces/tracking.interface';
import { TrackingWorkoutComponent } from '../tracking-workout/tracking-workout';
import { NavigatorWeek } from './navigator-week/navigator-week';
import { BtnComponent } from '../../../ui/btn/btn';
import { DialogComponent } from '../../../ui/dialog/dialog';
import { Loading } from '../../../ui/loading/loading';
import { TrackingWeekFacade } from './tracking-week.facade';
import { FormControlsOf } from '../../../../utils/form-types.util';
import { SelectTypeInput } from '../../../../interfaces/input.interface';

export type SelectType = FormControlsOf<SelectTypeInput>;

@Component({
    selector: 'app-tracking-week',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        NavigatorWeek,
        TrackingWorkoutComponent,
        BtnComponent,
        DialogComponent,
        Loading,
    ],
    providers: [TrackingWeekFacade],
    templateUrl: './tracking-week.html',
})
export class TrackingWeekComponent {
    tracking = input<TrackingVM | null>(null);
    facade = inject(TrackingWeekFacade);

    constructor() {
        effect(() => {
            this.facade.updateTracking(this.tracking());
        });
    }
}
