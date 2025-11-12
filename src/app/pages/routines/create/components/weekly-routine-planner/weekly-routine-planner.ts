// weekly-routine-planner.component.ts
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormControl } from '@angular/forms';
// import { DayPlan, DayIndex } from './types';
// import { RoutinesService } from './routines.service';
import { Observable, BehaviorSubject } from 'rxjs';
import { DayIndex, DayPlan } from '../../../../../shared/interfaces/routines.interface';
import { RoutinesServices } from '../../../../../core/services/routines/routines.service';
import { WeekDayCellComponent } from '../week-day-cell/week-day-cell';
import { BtnComponent } from '../../../../../shared/components/ui/btn/btn';

@Component({
    selector: 'app-weekly-routine-planner',
    standalone: true,
    templateUrl: './weekly-routine-planner.html',
    styleUrls: ['./weekly-routine-planner.css'],
    imports: [WeekDayCellComponent, BtnComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeeklyRoutinePlannerComponent implements OnInit {
    // distribución: la podrías calcular a partir de un input del padre
    distributionControl = new FormControl('2/7');
    days: DayPlan[] = [];
    selectedDay$ = new BehaviorSubject<DayIndex | null>(null);

    workoutOptions = [
        { name: 'Pecho', value: 'CHEST' },
        { name: 'Piernas', value: 'LEGS' },
        { name: 'Espalda', value: 'BACK' },
        { name: 'Hombros', value: 'SHOULDERS' },
        { name: 'Brazos', value: 'ARMS' },
    ];

    constructor(private routinesSvc: RoutinesServices) {}

    ngOnInit() {
        this.initDaysFromDistribution(this.distributionControl.value);
        console.log('Inicializando días con distribución:', this.distributionControl.value);
        this.distributionControl.valueChanges.subscribe((v) => this.initDaysFromDistribution(v));
    }

    private initDaysFromDistribution(dist: string | null) {
        // dist = "2/7" -> number of workout days = 2 (no validación exhaustiva)
        const parts = String(dist).split('/');
        const workouts = Number(parts[0]) || 0;
        this.days = Array.from({ length: 7 }, (_, i) => ({
            day: (i + 1) as DayIndex,
            kind: i < workouts ? 'WORKOUT' : 'REST',
            expanded: false,
        }));
    }

    onToggleKind(day: DayPlan, kind: 'REST' | 'WORKOUT') {
        day.kind = kind;
        if (kind === 'REST') {
            day.workoutType = undefined;
            day.routineId = undefined;
        }
    }

    onSelectWorkoutType(day: DayPlan, type: string) {
        day.workoutType = type;
        day.expanded = true; // UI: agranda fila
    }

    onSelectRoutine(day: DayPlan, routineId: string) {
        day.routineId = routineId;
        // marcar seleccionado etc
    }

    getDays() {
        return this.days;
    }

    // ejemplo de enviar al servicio
    savePlan(name: string, description: string) {
        return this.routinesSvc.saveWeeklyPlan({ name, description, days: this.days });
    }
}
