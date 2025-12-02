// weekly-routine-planner.component.ts
import {
    Component,
    OnInit,
    ChangeDetectionStrategy,
    Input,
    OnChanges,
    signal,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { DayIndex, DayPlan } from '../../../../../shared/interfaces/routines.interface';
import { RoutinesServices } from '../../../../../core/services/routines/routines.service';
import { WeekDayCellComponent } from '../week-day-cell/week-day-cell';
import { BtnComponent } from '../../../../../shared/components/ui/btn/btn';
import { DayOfRoutine } from '../day-of-routine/day-of-routine';

@Component({
    selector: 'app-weekly-routine-planner',
    standalone: true,
    templateUrl: './weekly-routine-planner.html',
    imports: [WeekDayCellComponent, BtnComponent, DayOfRoutine],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeeklyRoutinePlannerComponent implements OnInit, OnChanges {
    // distribución: la podrías calcular a partir de un input del padre
    @Input({ required: true }) distribution: string = '0/7';
    distributionControl = new FormControl('2/7');
    routineDay = [];
    days = signal<DayPlan[]>([]);
    selectedDay$ = new BehaviorSubject<DayIndex | null>(null);

    constructor(private routinesSvc: RoutinesServices) {}

    ngOnInit() {
        this.initDaysFromDistribution(this.distribution);
    }

    ngOnChanges() {
        this.initDaysFromDistribution(this.distribution);
    }

    private initDaysFromDistribution(dist: string | null) {
        const parts = String(dist).split('/');
        const workouts = Number(parts[0]) || 0;
        this.days.set(
            Array.from({ length: 7 }, (_, i) => ({
                day: (i + 1) as DayIndex,
                kind: i < workouts ? 'WORKOUT' : 'REST',
                expanded: false,
            })),
        );
    }

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
    }

    // ejemplo de enviar al servicio
    savePlan(name: string, description: string) {
        return this.routinesSvc.saveWeeklyPlan({ name, description, days: this.days() });
    }
}
