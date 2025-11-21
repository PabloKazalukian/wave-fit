import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormSelectComponent } from '../../../ui/select/select';
import { FormInputComponent } from '../../../ui/input/input';
import { FormControlsOf } from '../../../../utils/form-types.util';
import { RoutinesServices } from '../../../../../core/services/routines/routines.service';
import { FormControl, FormGroup } from '@angular/forms';
import { AuthService } from '../../../../../core/services/auth/auth.service';
import { SelectType } from '../../../../interfaces/input.interface';
import { BtnComponent } from '../../../ui/btn/btn';
import { RoutinePlan } from '../../../../interfaces/routines.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WeeklyRoutinePlannerComponent } from '../weekly-routine-planner/weekly-routine-planner';

type RoutinePlanType = FormControlsOf<RoutinePlan>;

@Component({
    selector: 'app-routine-plan-form',
    standalone: true,
    // imports: [FormSelectComponent, FormInputComponent],
    templateUrl: './routine-form.html',
    imports: [
        FormSelectComponent,
        FormSelectComponent,
        FormInputComponent,
        BtnComponent,
        WeeklyRoutinePlannerComponent,
    ],
})
export class RoutinePlanForm implements OnInit {
    private destroyRef = inject(DestroyRef);

    routineForm!: FormGroup<RoutinePlanType>;
    userId: string = '';
    show: boolean = false;

    options: SelectType[] = [
        { name: '1/7', value: '1' },
        { name: '2/7', value: '2' },
        { name: '3/7', value: '3' },
        { name: '4/7', value: '4' },
        { name: '5/7', value: '5' },
        { name: '6/7', value: '6' },
        { name: '7/7', value: '7' },
    ];

    constructor(
        private routinesSvc: RoutinesServices,
        private authSvc: AuthService,
    ) {}

    ngOnInit(): void {
        // console.log(this.authSvc.getStoredUser());
        this.routineForm = this.initForm();
        this.authSvc
            .me()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (result) => {
                    this.userId = result?.id || '';
                    this.routineForm.patchValue({ createdBy: this.userId });
                },
                error: (err) => {},
            });
    }

    initForm(): FormGroup<RoutinePlanType> {
        return new FormGroup<RoutinePlanType>({
            name: new FormControl('', { nonNullable: true }),
            description: new FormControl('', { nonNullable: true }),
            weekly_distribution: new FormControl('', { nonNullable: true }),
            routineDays: new FormControl(['', '', '', '', '', '', ''], { nonNullable: true }),
            createdBy: new FormControl('', { nonNullable: true }),
        });
    }

    onSubmit(): void {
        this.show = true;
    }

    onRestart(): void {
        this.show = false;
    }

    get nameControl(): FormControl<string> {
        return this.routineForm.get('name') as FormControl<string>;
    }

    get selectControl(): FormControl<string> {
        return this.routineForm.get('weekly_distribution') as FormControl<string>;
    }

    get descriptionControl(): FormControl<string> {
        return this.routineForm.get('description') as FormControl<string>;
    }
    get routinesDayControl(): FormControl<string[]> {
        return this.routineForm.get('routineDays') as FormControl<string[]>;
    }
}
