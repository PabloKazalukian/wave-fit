// week-day-cell.component.ts
import {
    Component,
    Input,
    Output,
    EventEmitter,
    ChangeDetectionStrategy,
    OnInit,
    DestroyRef,
    inject,
} from '@angular/core';
import { Observable } from 'rxjs';
import { RoutinesServices } from '../../../../../core/services/routines/routines.service';
import { DayPlan } from '../../../../../shared/interfaces/routines.interface';
import { RoutineListBoxComponent } from '../routine-list-box/routine-list-box';
import { AsyncPipe, NgClass } from '@angular/common';
import { FormSelectComponent } from '../../../../../shared/components/ui/select/select';
import { SelectType, SelectTypeInput } from '../../../../../shared/interfaces/input.interface';
import { FormControlsOf } from '../../../../../shared/utils/form-types.util';
import { FormControl, FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

type selectFormType = FormControlsOf<SelectTypeInput>;

@Component({
    selector: 'app-week-day-cell',
    standalone: true,
    templateUrl: './week-day-cell.html',
    styleUrls: ['./week-day-cell.css'],
    imports: [RoutineListBoxComponent, AsyncPipe, FormSelectComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeekDayCellComponent implements OnInit {
    private destroyRef = inject(DestroyRef);

    @Input() day!: DayPlan;
    @Input() workoutOptions: { name: string; value: string }[] = [];
    @Output() kindChange = new EventEmitter<'REST' | 'WORKOUT'>();
    @Output() typeSelect = new EventEmitter<string>();
    @Output() routineSelect = new EventEmitter<string>();

    routines$?: Observable<any[]>;
    selectForm!: FormGroup<selectFormType>;

    options: SelectType[] = [
        { name: 'Ejercicio', value: 'WORKOUT' },
        { name: 'Descanso', value: 'REST' },
    ];

    constructor(private routinesSvc: RoutinesServices) {}

    ngOnInit(): void {
        this.routinesSvc
            .getRoutinesByType('CHEST')
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data) => {
                    this.routines$ = this.routinesSvc.getRoutinesByType('CHEST');
                },
                error: (err) => {
                    console.error('Error fetching routines:', err);
                },
            });
        this.selectForm = this.initForm();
        this.selectControl.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((newValue) => {
                this.onKindChange(newValue as 'REST' | 'WORKOUT');
            });
        this.selectControl.setValue(this.day.kind);
    }

    initForm(): FormGroup<selectFormType> {
        return new FormGroup<selectFormType>({
            option: new FormControl('', { nonNullable: true }),
        });
    }

    onKindChange(kind: 'REST' | 'WORKOUT') {
        this.kindChange.emit(kind);
    }

    onTypeChange(type: string) {
        this.typeSelect.emit(type);

        this.routines$ = this.routinesSvc.getRoutinesByType(type);
    }

    onRoutinePick(id: string) {
        this.routineSelect.emit(id);
    }
    onExpandToggle(event: MouseEvent): void {
        // Evita que el click interno vuelva a colapsar si hacés click en subcomponentes
        event.stopPropagation();

        // Cambia el estado expandido (puede ser boolean o controlado desde el padre)
        this.day.expanded = !this.day.expanded;
    }

    get selectControl(): FormControl<string> {
        return this.selectForm.get('option') as FormControl<string>;
    }
}
