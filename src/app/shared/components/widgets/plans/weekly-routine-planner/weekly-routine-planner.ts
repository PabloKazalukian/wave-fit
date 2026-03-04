import {
    Component,
    ChangeDetectionStrategy,
    signal,
    inject,
    Output,
    computed,
    input,
    output,
} from '@angular/core';
import { Subject } from 'rxjs';
import { WeekDayCellComponent } from '../week-day-cell/week-day-cell';
import { BtnComponent } from '../../../../../shared/components/ui/btn/btn';
import { DayOfRoutine } from '../day-of-routine/day-of-routine';
import { DaysRoutineProgress } from './routine-days-progress/days-routine-progress.';
import { typeNotification } from '../routine-form/routine-form.facade';
import { DayPlanStateService } from '../../../../../core/services/plans/day-plan-state.service';
import { SpinnerComponent } from '../../../ui/icon/spinner';
import { IconComponent } from '../../../ui/icon/icon';
import { Notification } from '../../../ui/notification/notification';

@Component({
    selector: 'app-weekly-routine-planner',
    standalone: true,
    templateUrl: './weekly-routine-planner.html',
    imports: [
        WeekDayCellComponent,
        BtnComponent,
        DayOfRoutine,
        DaysRoutineProgress,
        SpinnerComponent,
        IconComponent,
        Notification,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeeklyRoutinePlannerComponent {
    public readonly stateSvc = inject(DayPlanStateService);
    @Output() outputSavePlan = new Subject<boolean>();

    routinePlan = this.stateSvc.routinePlan;
    distribution = computed(() => this.routinePlan()?.weekly_distribution || '0/7');

    daysSelected = signal<number>(0);

    loading = input<boolean>(false);
    complete = signal<boolean | null>(null);
    showNotification = output<boolean>();
    notification = input<typeNotification>();

    expandedDays = this.stateSvc.expandedDays;

    savePlan() {
        this.outputSavePlan.next(true);
    }

    handleCloseNotification() {
        console.log(this.notification());
        this.showNotification.emit(false);
    }
}
