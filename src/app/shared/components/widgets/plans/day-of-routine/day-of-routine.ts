import { Component, OnInit, signal, computed } from '@angular/core';
import { RoutineDayVM } from '../../../../interfaces/routines.interface';
import { ExerciseCategoryPipe } from '../../../../pipes/exercise-category.pipe';
import { CommonModule } from '@angular/common';
import { PlansService } from '../../../../../core/services/plans/plans.service';

type DayState = 'error' | 'accent' | 'rest' | 'complete';

@Component({
    selector: 'app-day-of-routine',
    imports: [ExerciseCategoryPipe, CommonModule],
    standalone: true,
    templateUrl: './day-of-routine.html',
})
export class DayOfRoutine implements OnInit {
    dayPlan = signal<RoutineDayVM[]>([]);
    userId: string = '';
    dayState: DayState = 'error';

    constructor(private planSvc: PlansService) {}

    ngOnInit(): void {
        this.planSvc.routinePlanVM$.pipe().subscribe({
            next: (e) => {
                this.dayPlan.set(e.routineDays);
            },
        });
    }

    computedDayPlan = computed(() => {
        return this.dayPlan().find((d) => d.expanded);
    });

    changeExpanded(routine: RoutineDayVM) {
        const currentDayPlan = this.dayPlan();
        const payload = currentDayPlan.map((day) => {
            return { ...day, expanded: day.day === routine.day };
        });
        this.dayPlan.update(() => payload);
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
