import { Component, effect, inject, input, OnInit } from '@angular/core';
import { CoachNavigatorWeek } from '../coach-navigator-week/coach-navigator-week';
import { CoachShowWorkout } from '../coach-show-workout/coach-show-workout';
import { Loading } from '../../../ui/loading/loading';
import { CoachManageWithPlanFacade } from '../coach-manage-with-plan/coach-manage-with-plan.facade';
import { WorkoutSessionVM } from '../../../../interfaces/tracking.interface';

@Component({
    selector: 'app-coach-manage',
    imports: [CoachNavigatorWeek, CoachShowWorkout, Loading],
    providers: [CoachManageWithPlanFacade],
    templateUrl: './coach-manage.html',
    styles: ``,
})
export class CoachManage implements OnInit {
    readonly facade = inject(CoachManageWithPlanFacade);

    planId = input.required<string>();

    constructor() {
        effect(() => {
            const id = this.planId();
            if (id) {
                this.facade.loadPlanById(id);
            }
        });
    }

    ngOnInit(): void {
        this.facade.init();
    }

    onDaySelected(workout: WorkoutSessionVM | null): void {
        this.facade.onDaySelected(workout);
    }
}
