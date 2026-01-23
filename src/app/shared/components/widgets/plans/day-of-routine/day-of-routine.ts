import { Component, OnInit, signal, DestroyRef, inject, computed } from '@angular/core';
import { DayPlan, RoutineDayVM } from '../../../../interfaces/routines.interface';
import { DayPlanService } from '../../../../../core/services/day-plan/day-plan.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ExerciseCategoryPipe } from '../../../../pipes/exercise-category.pipe';
import { take } from 'rxjs';
import { CommonModule } from '@angular/common';
import { PlansService } from '../../../../../core/services/plans/plans.service';

@Component({
    selector: 'app-day-of-routine',
    imports: [ExerciseCategoryPipe, CommonModule],
    standalone: true,
    templateUrl: './day-of-routine.html',
})
export class DayOfRoutine implements OnInit {
    private destroyRef = inject(DestroyRef);

    dayPlan = signal<RoutineDayVM[]>([]);
    userId: string = '';

    constructor(private planSvc: PlansService) {}

    ngOnInit(): void {
        this.planSvc.routinePlanVM$.pipe(take(1)).subscribe({
            next: (e) => {
                console.log(e.routineDays);
                this.dayPlan.set(e.routineDays);
            },
        });
        // dayPlanSvc.dayPlan$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        //     next: (e) => {
        //         this.dayPlan.set(e);
        //     },
        // });
    }

    computedDayPlan = computed(() => {
        return this.dayPlan().find((d) => d.expanded);
    });

    changeExpanded(routine: RoutineDayVM) {
        this.dayPlan.update((days) => {
            return days.map((day) => {
                if (routine.day === day.day) {
                    day.expanded = true;
                } else {
                    day.expanded = false;
                }
                return day;
            });
        });
        // DayPlanExpanded(d);
    }
    getDisplayContent(d: RoutineDayVM): string {
        if (d.kind === 'WORKOUT' && d.id) {
            return '✓';
        }

        if (d.kind === 'WORKOUT' && d.type && !d.id) {
            return '!';
        }

        return d.day.toString();
    }
}
