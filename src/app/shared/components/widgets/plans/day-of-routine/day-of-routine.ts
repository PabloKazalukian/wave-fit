import { Component, OnInit, computed, inject, DestroyRef } from '@angular/core';
import { RoutineDayVM } from '../../../../interfaces/routines.interface';
import { ExerciseCategoryPipe } from '../../../../pipes/exercise-category.pipe';
import { CommonModule } from '@angular/common';
import { PlansService } from '../../../../../core/services/plans/plans.service';
import { DayPlanStateService } from '../../../../../core/services/plans/day-plan-state.service';

type DayState = 'error' | 'accent' | 'rest' | 'complete';

@Component({
    selector: 'app-day-of-routine',
    imports: [ExerciseCategoryPipe, CommonModule],
    standalone: true,
    templateUrl: './day-of-routine.html',
})
export class DayOfRoutine implements OnInit {
    private readonly planSvc = inject(PlansService);
    public readonly stateSvc = inject(DayPlanStateService);

    dayPlan = computed(() => this.stateSvc.routinePlan()?.routineDays || []);
    computedDayPlan = this.stateSvc.routinaDay;

    userId = '';
    dayState: DayState = 'error';

    ngOnInit(): void {}

    changeExpanded(routine: RoutineDayVM) {
        this.stateSvc.setDay(routine.day);

        // Actualizamos el flag expanded en el plan para el resto de componentes (WeeklyRoutinePlanner)
        const currentDayPlan = this.dayPlan();
        const payload = currentDayPlan.map((day) => {
            return { ...day, expanded: day.day === routine.day };
        });
        this.planSvc.setDayRoutines(payload);
    }

    getDisplayContent(d: RoutineDayVM): string {
        if (d.kind === 'WORKOUT' && d.id) {
            return '✓';
        }

        if (d.kind === 'WORKOUT' && d.type && !d.id) {
            return '!';
        }
        if (d.kind !== 'WORKOUT' && d.kind !== 'REST') {
            return '!';
        }

        return d.day.toString();
    }

    getDayState(day: RoutineDayVM): DayState {
        if (day.kind !== 'REST' && day.kind !== 'WORKOUT') {
            return 'error';
        }

        if (day.kind === 'REST') {
            if (day.type || day.id) {
                return 'error';
            }
            return 'rest';
        }

        if (day.kind === 'WORKOUT') {
            if (day.id && day.type) {
                return 'complete';
            }
            if (!day.id) {
                return 'accent';
            }
            return 'accent';
        }

        return 'error';
    }
}
