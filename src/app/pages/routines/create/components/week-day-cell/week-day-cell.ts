// week-day-cell.component.ts
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';
import { RoutinesServices } from '../../../../../core/services/routines/routines.service';
import { DayPlan } from '../../../../../shared/interfaces/routines.interface';
import { RoutineListBoxComponent } from '../routine-list-box/routine-list-box';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'app-week-day-cell',
    standalone: true,
    templateUrl: './week-day-cell.html',
    styleUrls: ['./week-day-cell.css'],
    imports: [RoutineListBoxComponent, AsyncPipe],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeekDayCellComponent {
    @Input() day!: DayPlan;
    @Input() workoutOptions: { name: string; value: string }[] = [];
    @Output() kindChange = new EventEmitter<'REST' | 'WORKOUT'>();
    @Output() typeSelect = new EventEmitter<string>();
    @Output() routineSelect = new EventEmitter<string>();

    routines$?: Observable<any[]>;

    constructor(private routinesSvc: RoutinesServices) {}

    onKindChange(kind: 'REST' | 'WORKOUT') {
        this.kindChange.emit(kind);
    }

    onTypeChange(type: string) {
        this.typeSelect.emit(type);
        // lazy load routines
        this.routines$ = this.routinesSvc.getRoutinesByType(type);
    }

    onRoutinePick(id: string) {
        this.routineSelect.emit(id);
    }

    // get selectedRoutineControl(): FormSelectComponent {
    //   new FormControl(day.workoutType || null)
    // }
}
