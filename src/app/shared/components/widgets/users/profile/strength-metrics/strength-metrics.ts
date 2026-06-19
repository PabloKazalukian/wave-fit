import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { FormControlsOf } from '../../../../../utils/form-types.util';

import { BtnComponent } from '../../../../ui/btn/btn';
import { FormInputComponent } from '../../../../ui/input/input';
import { InputNumber } from '../../../../ui/input-number/input-number';
import { FormSelectComponent } from '../../../../ui/select/select';
import { SelectType } from '../../../../../interfaces/input.interface';
import { ConfidenceLevel, CreateStrengthMetricInput } from '../../../../../utils/profile.types';
import { UserProfileService } from '../../../../../../core/services/user/user-profile.service';

type StrengthMetricFormType = FormControlsOf<CreateStrengthMetricInput>;

@Component({
    selector: 'app-strength-metrics',

    standalone: true,

    imports: [ReactiveFormsModule, FormInputComponent, InputNumber, BtnComponent, FormSelectComponent],

    templateUrl: './strength-metrics.html',
})
export class StrengthMetrics implements OnInit {
    private destroyRef = inject(DestroyRef);
    private userProfileService = inject(UserProfileService);

    strengthForm!: FormGroup<StrengthMetricFormType>;

    strengthMetrics = this.userProfileService.userProfile;

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

            repsAtWeight: new FormControl(undefined as unknown as { weightKg: number; reps: number }, {
                nonNullable: true,
            }),

            confidenceLevel: new FormControl('estimated' as ConfidenceLevel, {
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

        this.userProfileService
            .createStrengthMetric(this.strengthForm.getRawValue())
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.strengthForm.reset();
            });
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
