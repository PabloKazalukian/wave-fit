import { Component, effect, inject, input, output, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CoachNavigatorWeek } from '../coach-navigator-week/coach-navigator-week';
import { CoachShowWorkout } from '../coach-show-workout/coach-show-workout';
import { BtnComponent } from '../../../ui/btn/btn';
import { TrainingPlanDetail } from '../../../../interfaces/coach.interface';
import { CoachManageWithPlanFacade } from './coach-manage-with-plan.facade';
import { WorkoutSessionVM } from '../../../../interfaces/tracking.interface';

@Component({
    selector: 'app-coach-manage-with-plan',
    imports: [CoachNavigatorWeek, CoachShowWorkout, FormsModule, BtnComponent],
    providers: [CoachManageWithPlanFacade],
    templateUrl: './coach-manage-with-plan.html',
    styles: ``,
})
export class CoachManageWithPlan implements OnInit {
    readonly facade = inject(CoachManageWithPlanFacade);

    planData = input.required<TrainingPlanDetail>();

    confirmPlan = output<void>();
    deletePlan = output<void>();
    modifyPlan = output<string>();

    modificationsComment = '';

    get canModify(): boolean {
        return this.modificationsComment.trim().split(/\s+/).filter(Boolean).length >= 10;
    }

    constructor() {
        effect(() => {
            const plan = this.planData();
            if (plan) {
                this.facade.buildFromPlan(plan);
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
