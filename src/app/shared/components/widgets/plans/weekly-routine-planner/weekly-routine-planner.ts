import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { WeekDayCellComponent } from '../week-day-cell/week-day-cell';
import { DayOfRoutine } from '../day-of-routine/day-of-routine';
import { DaysRoutineProgress } from './routine-days-progress/days-routine-progress.';
import { DayPlanStateService } from '../../../../../core/services/plans/day-plan-state.service';

@Component({
    selector: 'app-weekly-routine-planner',
    standalone: true,
    templateUrl: './weekly-routine-planner.html',
    imports: [WeekDayCellComponent, DayOfRoutine, DaysRoutineProgress],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeeklyRoutinePlannerComponent {
    public readonly stateSvc = inject(DayPlanStateService);
    daysSelected = signal<number>(0);
    expandedDays = this.stateSvc.expandedDays;
}
