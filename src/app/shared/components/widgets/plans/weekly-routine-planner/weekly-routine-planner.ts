// weekly-routine-planner.component.ts
import {
    Component,
    OnInit,
    ChangeDetectionStrategy,
    Input,
    OnChanges,
    signal,
    effect,
    inject,
    DestroyRef,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { BehaviorSubject, tap } from 'rxjs';
import { DayIndex, DayPlan } from '../../../../../shared/interfaces/routines.interface';
import { RoutinesServices } from '../../../../../core/services/routines/routines.service';
import { WeekDayCellComponent } from '../week-day-cell/week-day-cell';
import { BtnComponent } from '../../../../../shared/components/ui/btn/btn';
import { DayOfRoutine } from '../day-of-routine/day-of-routine';
import { DayPlanService } from '../../../../../core/services/day-plan/day-plan.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../../../core/services/auth/auth.service';

@Component({
    selector: 'app-weekly-routine-planner',
    standalone: true,
    templateUrl: './weekly-routine-planner.html',
    imports: [WeekDayCellComponent, BtnComponent, DayOfRoutine],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeeklyRoutinePlannerComponent implements OnInit {
    private destroyRef = inject(DestroyRef);

    // distribución: la podrías calcular a partir de un input del padre
    @Input({ required: true }) distribution: string = '0/7';
    distributionControl = new FormControl('2/7');
    // routineDay = [];
    days = signal<DayPlan[]>([]);
    daysSelected = signal<number>(0);
    selectedDay$ = new BehaviorSubject<DayIndex | null>(null);
    userId!: string;

    constructor(private dayPlanSvc: DayPlanService) {}

    ngOnInit() {
        // this.initDaysFromDistribution(this.distribution);

        this.dayPlanSvc.dayPlan$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (value) => {
                this.days.set(value);
            },
        });
    }

    controlChange = effect(() => {
        const count = this.days().reduce(
            (count, current) => count + (current.kind === 'WORKOUT' ? 1 : 0),
            0,
        );
        this.daysSelected.set(count);
    });

    onToggleKind(day: DayPlan, kind: 'REST' | 'WORKOUT') {
        const newDay = this.days().filter((d) => {
            if (day.day === d.day) {
                d.kind = kind;
                if (kind === 'REST') {
                    d.workoutType = undefined;
                    d.routineId = undefined;
                }
            }
            return d;
        });
        this.days.set(newDay);
        this.dayPlanSvc.setPlanDay(newDay);
    }

    // ejemplo de enviar al servicio
    savePlan(name: string, description: string) {
        // return this.routinesSvc.saveWeeklyPlan({ name, description, days: this.days() });
    }
}
