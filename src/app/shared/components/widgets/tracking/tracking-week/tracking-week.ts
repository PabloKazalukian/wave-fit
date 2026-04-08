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
import { Dumbbell } from 'lucide-angular';
import { InfoCard } from '../../../ui/info-card/info-card';
import { ExtraSessionForm } from '../../extra-session/extra-session-form/extra-session-form';
import { IconComponent } from '../../../ui/icon/icon';

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
        InfoCard,
        ExtraSessionForm,
        IconComponent,
    ],
    providers: [TrackingWeekFacade],
    templateUrl: './tracking-week.html',
})
export class TrackingWeekComponent {
    tracking = input<TrackingVM | null>(null);
    facade = inject(TrackingWeekFacade);

    feature = {
        icon: Dumbbell,
        title: 'Progresión Semanal',
        description: ` • Lleva tu progresion de esta semana.
            • Agrega los ejercicios que vas a realizar y anota tus series.
            • Podes dar finalizada la semana cuando quieras.
        `,
    };

    constructor() {
        effect(() => {
            this.facade.updateTracking(this.tracking());
        });
    }
}
