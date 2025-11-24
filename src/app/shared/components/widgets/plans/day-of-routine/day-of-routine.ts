import { Component, Input } from '@angular/core';
import { DayPlan } from '../../../../interfaces/routines.interface';

@Component({
    selector: 'app-day-of-routine',
    imports: [],
    standalone: true,
    templateUrl: './day-of-routine.html',
    styles: ``,
})
export class DayOfRoutine {
    @Input() dayPlan!: DayPlan;

    constructor() {}
}
