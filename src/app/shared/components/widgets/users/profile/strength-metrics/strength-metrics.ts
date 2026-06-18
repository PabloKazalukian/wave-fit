import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { FormControlsOf } from '../../../../../utils/form-types.util';

import { BtnComponent } from '../../../../ui/btn/btn';
import { FormInputComponent } from '../../../../ui/input/input';
import { InputNumber } from '../../../../ui/input-number/input-number';
import { FormSelectComponent } from '../../../../ui/select/select';
import { SelectType } from '../../../../../interfaces/input.interface';
import { ConfidenceLevel } from '../../../../../utils/profile.types';

export interface StrengthMetricForm {
    exerciseKey: string;

    oneRmKg: number;

    confidenceLevel: ConfidenceLevel;

    measuredAt: string;

    notes: string;
}

type StrengthMetricFormType = FormControlsOf<StrengthMetricForm>;

@Component({
    selector: 'app-strength-metrics',

    standalone: true,

    imports: [ReactiveFormsModule, FormInputComponent, InputNumber, BtnComponent, FormSelectComponent],

    templateUrl: './strength-metrics.html',
})
export class StrengthMetrics implements OnInit {
    strengthForm!: FormGroup<StrengthMetricFormType>;

    confidenceOptions: SelectType[] = [
        { name: 'Probado', value: 'tested' },
        { name: 'Estimado', value: 'estimated' },
        { name: 'Auto-reportado', value: 'self_reported' },
    ];

    ngOnInit(): void {
        this.strengthForm = this.initForm();
    }

    initForm(): FormGroup<StrengthMetricFormType> {
        return new FormGroup<StrengthMetricFormType>({
            exerciseKey: new FormControl('', {
                nonNullable: true,

                validators: [Validators.required],
            }),

            oneRmKg: new FormControl(0, {
                nonNullable: true,

                validators: [Validators.required, Validators.min(1)],
            }),

            confidenceLevel: new FormControl('estimated', {
                nonNullable: true,
            }),

            measuredAt: new FormControl('', {
                nonNullable: true,

                validators: [Validators.required],
            }),

            notes: new FormControl('', {
                nonNullable: true,
            }),
        });
    }

    onSubmit() {
        if (this.strengthForm.invalid) return;

        const payload = this.strengthForm.getRawValue();

        console.log(payload);
    }

    get exerciseKeyControl() {
        return this.strengthForm.get('exerciseKey')! as FormControl<string>;
    }

    get oneRmKgControl() {
        return this.strengthForm.get('oneRmKg')! as FormControl<number>;
    }

    get confidenceLevelControl() {
        return this.strengthForm.get('confidenceLevel')! as FormControl<ConfidenceLevel>;
    }

    get measuredAtControl() {
        return this.strengthForm.get('measuredAt')! as FormControl<string>;
    }

    get notesControl() {
        return this.strengthForm.get('notes')! as FormControl<string>;
    }
}
