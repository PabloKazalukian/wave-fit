import { Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DayLogVM } from '../../../../interfaces/day-log.interface';
import { TrackingWorkoutComponent } from '../tracking-workout/tracking-workout';
import { BtnComponent } from '../../../ui/btn/btn';
import { DialogComponent } from '../../../ui/dialog/dialog';
import { Loading } from '../../../ui/loading/loading';
import { InfoCard } from '../../../ui/info-card/info-card';
import { ExtraSessionForm } from '../../extra-session/extra-session-form/extra-session-form';
import { IconComponent } from '../../../ui/icon/icon';
import { Dumbbell } from 'lucide-angular';
import { TrackingDayFacade } from './tracking-day.facade';
import { DateService } from '../../../../../core/services/date.service';

@Component({
    selector: 'app-tracking-day',
    standalone: true,
    imports: [
        CommonModule,
        TrackingWorkoutComponent,
        BtnComponent,
        DialogComponent,
        Loading,
        InfoCard,
        ExtraSessionForm,
        IconComponent,
    ],
    providers: [TrackingDayFacade],
    templateUrl: './tracking-day.html',
})
export class TrackingDayComponent {
    dayLog = input<DayLogVM | null>(null);
    facade = inject(TrackingDayFacade);
    dateSvc = inject(DateService);

    feature = {
        icon: Dumbbell,
        title: 'Progresión del Día',
        description: ` • Lleva el progreso de tu entrenamiento de hoy.
            • Agrega los ejercicios que vas a realizar y anota tus series.
            • Podes dar finalizado tu día cuando quieras.
        `,
    };
}
