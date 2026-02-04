import { Component, signal } from '@angular/core';
import { BtnComponent } from '../../shared/components/ui/btn/btn';
import { RoutineSchedulerComponent } from '../../shared/components/widgets/tracking/routine-scheduler/routine-scheduler';

@Component({
    selector: 'app-my-day',
    imports: [BtnComponent, RoutineSchedulerComponent],
    standalone: true,
    templateUrl: './my-day.html',
    styles: ``,
})
export class MyDay {
    routineActivated = signal<boolean>(true);
}
