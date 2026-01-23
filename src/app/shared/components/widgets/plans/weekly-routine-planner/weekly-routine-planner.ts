import {
    Component,
    OnInit,
    ChangeDetectionStrategy,
    Input,
    signal,
    effect,
    inject,
    DestroyRef,
    Output,
    computed,
} from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import {
    DayIndex,
    DayPlan,
    RoutineDay,
    RoutineDayVM,
} from '../../../../../shared/interfaces/routines.interface';
import { WeekDayCellComponent } from '../week-day-cell/week-day-cell';
import { BtnComponent } from '../../../../../shared/components/ui/btn/btn';
import { DayOfRoutine } from '../day-of-routine/day-of-routine';
import { DayPlanService } from '../../../../../core/services/day-plan/day-plan.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DaysRoutineProgress } from './routine-days-progress/days-routine-progress.';
import { PlansService } from '../../../../../core/services/plans/plans.service';

@Component({
    selector: 'app-weekly-routine-planner',
    standalone: true,
    templateUrl: './weekly-routine-planner.html',
    imports: [WeekDayCellComponent, BtnComponent, DayOfRoutine, DaysRoutineProgress],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeeklyRoutinePlannerComponent implements OnInit {
    private destroyRef = inject(DestroyRef);
    @Output() outputSavePlan = new Subject<boolean>();

    @Input({ required: true }) distribution: string = '0/7';

    days = signal<RoutineDayVM[]>([]);
    daysSelected = signal<number>(0);
    selectedDay$ = new BehaviorSubject<DayIndex | null>(null);

    constructor(
        private dayPlanSvc: DayPlanService,
        private planSvc: PlansService,
    ) {}

    ngOnInit() {
        // this.dayPlanSvc.dayPlan$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        //     next: (value) => {
        //         this.days.set(value);
        //     },
        // });
        this.planSvc.routinePlanVM$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (plan) => {
                this.days.set(plan.routineDays);
            },
        });
    }

    expandedDays = computed(() => this.days().filter((d) => d.expanded === true));

    controlChange = effect(() => {
        const count = this.days().reduce(
            (count, current) => count + (current.kind === 'WORKOUT' ? 1 : 0),
            0,
        );
        this.daysSelected.set(count);
    });

    onToggleKind(day: RoutineDayVM, kind: 'REST' | 'WORKOUT') {
        const newDay: RoutineDayVM[] = this.days().filter((d) => {
            if (day.day === d.day) {
                d.kind = kind;
                if (kind === 'REST') {
                    d.type = undefined;
                    d.id = undefined;
                }
            }
            return d;
        });
        this.days.set(newDay);
        this.planSvc.setKindRoutineDay(day.day - 1, kind);
        // this.dayPlanSvc.setPlanDay(newDay);
    }

    savePlan(name: string, description: string) {
        this.outputSavePlan.next(true);
    }
}
