import { NgClass } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { BtnComponent } from '../../../../ui/btn/btn';
import { PlansService } from '../../../../../../core/services/plans/plans.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { DayPlanStateService } from '../../../../../../core/services/plans/day-plan-state.service';
import { RoutineDayVM } from '../../../../../interfaces/routines.interface';
import { map } from 'rxjs';

@Component({
    selector: 'app-days-routine-progress.',
    imports: [NgClass, BtnComponent],
    standalone: true,
    templateUrl: './days-routine-progress.html',
})
export class DaysRoutineProgress {
    public readonly stateSvc = inject(DayPlanStateService);
    public readonly plansSvc = inject(PlansService);

    distribution = toSignal(
        this.plansSvc.routinePlanVM$.pipe(map((plan) => plan?.weekly_distribution)),
    );
    daysSelected = signal<number>(0); // Este sigue siendo el conteo de rutinas

    days = computed(() => this.routinePlan()?.routineDays || []);
    controlChange = effect(() => {
        const d = this.days();
        const count = d.reduce((count, current) => count + (current.kind === 'WORKOUT' ? 1 : 0), 0);
        this.daysSelected.set(count);
    });
    routinePlan = this.stateSvc.routinePlan;
    indexDay = this.stateSvc.indexDay; // Se agrega para trackear el día seleccionado

    // Parseamos solo el primer número
    target = computed(() => {
        if (!this.distribution()) return 0;
        const [first] = this.distribution()!.split('/');
        return Number(first ?? 0);
    });

    missed = computed(() => {
        const plan = this.routinePlan();
        if (!plan) return 0;

        return plan.routineDays.reduce((acc: number, routine: RoutineDayVM) => {
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
        this.plansSvc.setWeeklyDistribution(this.daysSelected().toString());
    }

    setDay(day: number) {
        this.stateSvc.setDay(day);
    }
}
