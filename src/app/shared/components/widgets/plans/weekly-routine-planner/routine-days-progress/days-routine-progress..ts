import { NgClass } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { BtnComponent } from '../../../../ui/btn/btn';
import { RoutinePlanCreate } from '../../../../../interfaces/routines.interface';
import { PlansService } from '../../../../../../core/services/plans/plans.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-days-routine-progress.',
    imports: [NgClass, BtnComponent],
    standalone: true,
    templateUrl: './days-routine-progress.html',
})
export class DaysRoutineProgress {
    distribution = input<string>('');
    daysSelected = input<number>(0);
    routinePlan;

    constructor(private planService: PlansService) {
        this.routinePlan = toSignal(this.planService.routinePlanVM$, {
            initialValue: null,
        });
    }

    // Parseamos solo el primer número
    target = computed(() => {
        const [first] = this.distribution().split('/');
        return Number(first ?? 0);
    });

    missed = computed(() => {
        const plan = this.routinePlan();
        if (!plan) return 0;

        // const target_ = this.target();
        return plan.routineDays.reduce((acc, routine) => {
            // console.log(routine);
            if (routine.id) return acc + 1;
            else return acc;
        }, 0);
    });

    exceeded = computed(() => this.daysSelected() > this.target());
    complete = computed(() => this.daysSelected() === this.target());
    remaining = computed(() => this.target() - this.daysSelected());

    state = computed<'error' | 'complete' | 'incomplete'>(() => {
        if (this.exceeded()) return 'error';
        if (this.complete()) return 'complete';
        return 'incomplete';
    });

    changeDistribution() {
        const payload = this.daysSelected().toString();
        this.planService.routinePlanVM$.subscribe({
            next: (plan) => {
                if (plan?.weekly_distribution) {
                    plan.weekly_distribution = payload;
                    this.planService.setRoutinePlan(plan);
                }
            },
        });
    }
}
