import { Component, OnInit, signal, DestroyRef, inject, computed } from '@angular/core';
import { DayPlan } from '../../../../interfaces/routines.interface';
import { DayPlanService } from '../../../../../core/services/day-plan/day-plan.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ExerciseCategoryPipe } from '../../../../pipes/exercise-category.pipe';
import { take } from 'rxjs';

@Component({
    selector: 'app-day-of-routine',
    imports: [ExerciseCategoryPipe],
    standalone: true,
    templateUrl: './day-of-routine.html',
})
export class DayOfRoutine implements OnInit {
    private destroyRef = inject(DestroyRef);

    dayPlan = signal<DayPlan[]>([]);
    userId: string = '';

    constructor(private dayPlanSvc: DayPlanService) {}

    computedDayPlan = computed(() => {
        return this.dayPlan().find((d) => d.expanded);
    });

    ngOnInit(): void {
        this.dayPlanSvc.dayPlan$.pipe(takeUntilDestroyed(this.destroyRef), take(1)).subscribe({
            next: (e) => {
                console.log(e);
                this.dayPlan.set(e);
            },
        });
    }

    changeExpanded(d: DayPlan) {
        this.dayPlanSvc.changeDayPlanExpanded(d);
    }
    getDisplayContent(d: DayPlan): string {
        // Si tiene routineId, mostrar checkmark
        if (d.kind === 'WORKOUT' && d.routineId) {
            return '✓';
        }

        // Si es WORKOUT con workoutType pero sin routineId, mostrar !
        if (d.kind === 'WORKOUT' && d.workoutType && !d.routineId) {
            return '!';
        }

        // En cualquier otro caso, mostrar el número del día
        return d.day.toString();
    }
}
