import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormControlsOf } from '../../../../../utils/form-types.util';
import { FormInputComponent } from '../../../../ui/input/input';
import { InputNumber } from '../../../../ui/input-number/input-number';
import { BtnComponent } from '../../../../ui/btn/btn';

export interface ScheduleForm {
    daysPerWeek: number;
    preferredDays: number[];
    sessionDurationMin: number;
    preferredTime: string;
    restDayActivity: string;
}

type ScheduleFormType = FormControlsOf<ScheduleForm>;

@Component({
    selector: 'app-schedule',
    standalone: true,
    imports: [ReactiveFormsModule, FormInputComponent, InputNumber, BtnComponent],
    templateUrl: './schedule.html',
})
export class Schedule implements OnInit {
    scheduleForm!: FormGroup<ScheduleFormType>;

    ngOnInit(): void {
        this.scheduleForm = this.initForm();
    }

    initForm(): FormGroup<ScheduleFormType> {
        return new FormGroup<ScheduleFormType>({
            daysPerWeek: new FormControl(3, {
                nonNullable: true,
                validators: [Validators.required, Validators.min(1), Validators.max(7)],
            }),
            preferredDays: new FormControl([], { nonNullable: true }),
            sessionDurationMin: new FormControl(60, {
                nonNullable: true,
                validators: [Validators.required, Validators.min(15)],
            }),
            preferredTime: new FormControl('', { nonNullable: true }),
            restDayActivity: new FormControl('', { nonNullable: true }),
        });
    }

    onSubmit() {
        if (this.scheduleForm.invalid) return;
        console.log(this.scheduleForm.getRawValue());
    }

    get daysPerWeekControl() {
        return this.scheduleForm.get('daysPerWeek')! as FormControl<number>;
    }

    get preferredDaysControl() {
        return this.scheduleForm.get('preferredDays')! as FormControl<number[]>;
    }

    get sessionDurationMinControl() {
        return this.scheduleForm.get('sessionDurationMin')! as FormControl<number>;
    }

    get preferredTimeControl() {
        return this.scheduleForm.get('preferredTime')! as FormControl<string>;
    }

    get restDayActivityControl() {
        return this.scheduleForm.get('restDayActivity')! as FormControl<string>;
    }
}
