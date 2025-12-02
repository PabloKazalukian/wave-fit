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
import { RoutineListBoxComponent } from '../../../../../shared/components/widgets/routines/routine-list-box/routine-list-box';
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
    imports: [RoutineListBoxComponent, FormSelectComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeekDayCellComponent implements OnInit {
    private destroyRef = inject(DestroyRef);

    @Input() day!: DayPlan;
    @Output() kindChange = new EventEmitter<'REST' | 'WORKOUT'>();

    routines$?: Observable<any[]>;
    selectForm!: FormGroup<selectFormType>;

    options: SelectType[] = [
        { name: 'Ejercicio', value: 'WORKOUT' },
        { name: 'Descanso', value: 'REST' },
    ];

    constructor(private routinesSvc: RoutinesServices) {}

    ngOnInit(): void {
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
