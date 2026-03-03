// week-day-cell.component.ts
import {
    Component,
    ChangeDetectionStrategy,
    OnInit,
    DestroyRef,
    inject,
    signal,
    computed,
    effect,
} from '@angular/core';
import { DayPlanStateService } from '../../../../../core/services/plans/day-plan-state.service';
import { filter, tap } from 'rxjs';
import { RoutineListBoxComponent } from '../../../../../shared/components/widgets/routines/routine-list-box/routine-list-box';
import { FormSelectComponent } from '../../../../../shared/components/ui/select/select';
import { SelectType, SelectTypeInput } from '../../../../../shared/interfaces/input.interface';
import { FormControlsOf } from '../../../../../shared/utils/form-types.util';
import { FormControl, FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../../../core/services/auth/auth.service';
import { PlansService } from '../../../../../core/services/plans/plans.service';

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
    private readonly authSvc = inject(AuthService);
    public readonly stateSvc = inject(DayPlanStateService);
    private readonly plansSvc = inject(PlansService);

    constructor() {
        effect(() => {
            const currentDay = this.day();
            if (currentDay && this.selectControl.value !== currentDay.kind) {
                this.selectControl.setValue(currentDay.kind as string, { emitEvent: false });
                this.isExpanded.set(currentDay.kind === 'WORKOUT');
            }
        });
    }

    // Recibimos solo el número de día
    dayNumber = this.stateSvc.indexDay;

    // Derivamos el objeto day del state
    day = computed(() => {
        const plan = this.stateSvc.routinePlan();
        return plan?.routineDays.find((d) => d.day === this.dayNumber());
    });

    selectForm!: FormGroup<selectFormType>;
    userId = this.authSvc.user().id;
    isExpanded = signal<boolean>(false);

    options: SelectType[] = [
        { name: 'Ejercicio', value: 'WORKOUT' },
        { name: 'Descanso', value: 'REST' },
    ];

    ngOnInit(): void {
        this.selectForm = this.initForm();

        this.selectControl.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((newValue) => {
                if (newValue) {
                    this.onKindChange(newValue as 'REST' | 'WORKOUT');
                }
            });
    }

    initForm(): FormGroup<selectFormType> {
        return new FormGroup<selectFormType>({
            option: new FormControl('', { nonNullable: true }),
        });
    }

    onKindChange(kind: 'REST' | 'WORKOUT') {
        this.stateSvc.setKind(kind);

        this.isExpanded.set(kind === 'WORKOUT');
    }

    onClear() {
        this.selectControl.setValue('REST');
        this.plansSvc.removeDayRoutine(this.dayNumber());
        this.isExpanded.set(false);
    }

    get selectControl(): FormControl<string | null> {
        return this.selectForm.get('option') as FormControl<string | null>;
    }
}
