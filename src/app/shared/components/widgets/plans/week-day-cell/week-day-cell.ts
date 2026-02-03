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
    signal,
} from '@angular/core';
import { filter, tap } from 'rxjs';
import { RoutineDayVM } from '../../../../../shared/interfaces/routines.interface';
import { RoutineListBoxComponent } from '../../../../../shared/components/widgets/routines/routine-list-box/routine-list-box';
import { FormSelectComponent } from '../../../../../shared/components/ui/select/select';
import { SelectType, SelectTypeInput } from '../../../../../shared/interfaces/input.interface';
import { FormControlsOf } from '../../../../../shared/utils/form-types.util';
import { FormControl, FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../../../core/services/auth/auth.service';

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

    @Input() day!: RoutineDayVM;
    @Output() kindChange = new EventEmitter<'REST' | 'WORKOUT'>();

    selectForm!: FormGroup<selectFormType>;
    userId!: string;

    isExpanded = signal<boolean>(false);

    options: SelectType[] = [
        { name: 'Ejercicio', value: 'WORKOUT' },
        { name: 'Descanso', value: 'REST' },
    ];

    private readonly authSvc = inject(AuthService);

    ngOnInit(): void {
        this.selectForm = this.initForm();
        this.authSvc.user$
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                filter((user) => !!user),
                tap((user) => (this.userId = user ? user : '')),
            )
            .subscribe();

        this.selectControl.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((newValue) => {
                this.onKindChange(newValue as 'REST' | 'WORKOUT');
            });
        if (this.day.kind) this.selectControl.setValue(this.day.kind);
    }

    initForm(): FormGroup<selectFormType> {
        return new FormGroup<selectFormType>({
            option: new FormControl('', { nonNullable: true }),
        });
    }

    onKindChange(kind: 'REST' | 'WORKOUT') {
        this.kindChange.emit(kind);

        this.isExpanded.set(kind === 'WORKOUT');
    }
    onExpandToggle(event: MouseEvent): void {
        event.stopPropagation();

        this.day.expanded = !this.day.expanded;
    }

    onClear() {
        this.selectControl.setValue('REST');
        this.onKindChange('REST');
    }

    get selectControl(): FormControl<string | null> {
        return this.selectForm.get('option') as FormControl<string | null>;
    }
}
