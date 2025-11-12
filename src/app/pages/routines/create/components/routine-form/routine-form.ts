import { Component, OnInit } from '@angular/core';
import { FormSelectComponent } from '../../../../../shared/components/ui/select/select';
import { FormInputComponent } from '../../../../../shared/components/ui/input/input';
import { FormControlsOf } from '../../../../../shared/utils/form-types.util';
import { RoutinesServices } from '../../../../../core/services/routines/routines.service';
import { FormControl, FormGroup } from '@angular/forms';
import { AuthService } from '../../../../../core/services/auth/auth.service';
import { SelectType } from '../../../../../shared/interfaces/input.interface';
import { BtnComponent } from '../../../../../shared/components/ui/btn/btn';
import { WeeklyRoutinePlannerComponent } from '../weekly-routine-planner/weekly-routine-planner';

type RoutinePlanType = FormControlsOf<RoutinePlan>;
export interface RoutinePlan {
    name: string;
    description: string;
    weekly_distribution?: string;
    routineDays: string;
    createdBy?: string;
}

@Component({
    selector: 'app-routine-form',
    standalone: true,
    // imports: [FormSelectComponent, FormInputComponent],
    templateUrl: './routine-form.html',
    styleUrl: './routine-form.css',
    imports: [
        FormSelectComponent,
        FormSelectComponent,
        FormInputComponent,
        BtnComponent,
        WeeklyRoutinePlannerComponent,
    ],
})
export class RoutineForm implements OnInit {
    routineForm!: FormGroup<RoutinePlanType>;
    userId: string = '';

    options: SelectType[] = [
        { name: '1/7', value: '1' },
        { name: '2/7', value: '2' },
        { name: '3/7', value: '3' },
        { name: '4/7', value: '4' },
        { name: '5/7', value: '5' },
        { name: '6/7', value: '6' },
        { name: '7/7', value: '7' },
    ];

    constructor(private routinesSvc: RoutinesServices, private authSvc: AuthService) {}
    ngOnInit(): void {
        // console.log(this.authSvc.getStoredUser());
        this.authSvc.me().subscribe({
            next: (result) => {
                console.log('Usuario actual:', result);
                this.userId = result?.id || '';
                this.routineForm = this.initForm();
                this.routineForm.patchValue({ createdBy: this.userId });
                console.log(this.routineForm.value);
                console.log(this.routineForm.get('createdBy')?.value);
            },
            error: (err) => {
                console.log(err);
            },
        });
    }

    initForm(): FormGroup<RoutinePlanType> {
        return new FormGroup<RoutinePlanType>({
            name: new FormControl('', { nonNullable: true }),
            description: new FormControl('', { nonNullable: true }),
            weekly_distribution: new FormControl('', { nonNullable: true }),
            routineDays: new FormControl('', { nonNullable: true }),
            createdBy: new FormControl('', { nonNullable: true }),
        });
    }

    onSubmit(): void {}

    get nameControl(): FormControl<string> {
        return this.routineForm.get('name') as FormControl<string>;
    }

    get selectControl(): FormControl<string> {
        return this.routineForm.get('weekly_distribution') as FormControl<string>;
    }

    get descriptionControl(): FormControl<string> {
        return this.routineForm.get('description') as FormControl<string>;
    }
}
