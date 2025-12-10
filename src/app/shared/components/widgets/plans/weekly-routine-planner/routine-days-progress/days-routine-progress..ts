import { NgClass } from '@angular/common';
import { Component, computed, EventEmitter, input, Output } from '@angular/core';
import { BtnComponent } from '../../../../ui/btn/btn';
import { RoutinePlanCreate } from '../../../../../interfaces/routines.interface';
import { PlansService } from '../../../../../../core/services/plans/plans.service';

@Component({
    selector: 'app-days-routine-progress.',
    imports: [NgClass, BtnComponent],
    standalone: true,
    templateUrl: './days-routine-progress.html',
    styles: ``,
})
export class DaysRoutineProgress {
    distribution = input<string>('');
    daysSelected = input<number>(0);

    constructor(private planService: PlansService) {}

    // Parseamos solo el primer número
    target = computed(() => {
        const [first] = this.distribution().split('/');
        return Number(first ?? 0);
    });

    exceeded = computed(() => this.daysSelected() > this.target());
    complete = computed(() => this.daysSelected() === this.target());
    remaining = computed(() => this.target() - this.daysSelected());

    state = computed<'error' | 'complete' | 'incomplete'>(() => {
        if (this.exceeded()) return 'error';
        if (this.complete()) return 'complete';
        return 'incomplete';
    });

    setDistribution() {
        const payload = this.daysSelected().toString();
        console.log(payload);
        // this.distribution = payload+'/7'
        const plan: RoutinePlanCreate | null = this.planService.getRoutinePlan(
            this.planService.userId(),
        );
        console.log(plan);

        if (plan?.weekly_distribution) {
            plan.weekly_distribution = payload;
            this.planService.setRoutinePlan(plan);
            console.log(plan);
        }
    }
}
