import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormControlsOf } from '../../../../../utils/form-types.util';
import { FormInputComponent } from '../../../../ui/input/input';
import { FormSelectComponent } from '../../../../ui/select/select';
import { SelectType } from '../../../../../interfaces/input.interface';
import { BtnComponent } from '../../../../ui/btn/btn';

export interface HealthConstraintForm {
    injuries: string[];
    movementRestrictions: string[];
    conditions: string[];
    mobilityLevel: string;
    hasHealthcareSupervision: boolean;
}

type HealthConstraintFormType = FormControlsOf<HealthConstraintForm>;

@Component({
    selector: 'app-health-constraints',
    standalone: true,
    imports: [ReactiveFormsModule, BtnComponent, FormSelectComponent],
    templateUrl: './health-constraints.html',
})
export class HealthConstraints implements OnInit {
    healthForm!: FormGroup<HealthConstraintFormType>;

    mobilityLevelOptions: SelectType[] = [
        { name: 'Limitada', value: 'limited' },
        { name: 'Moderada', value: 'moderate' },
        { name: 'Buena', value: 'good' },
        { name: 'Excelente', value: 'excellent' },
    ];

    ngOnInit(): void {
        this.healthForm = this.initForm();
    }

    initForm(): FormGroup<HealthConstraintFormType> {
        return new FormGroup<HealthConstraintFormType>({
            injuries: new FormControl([], { nonNullable: true }),
            movementRestrictions: new FormControl([], { nonNullable: true }),
            conditions: new FormControl([], { nonNullable: true }),
            mobilityLevel: new FormControl('', {
                nonNullable: true,
                validators: [Validators.required],
            }),
            hasHealthcareSupervision: new FormControl(false, { nonNullable: true }),
        });
    }

    onSubmit() {
        if (this.healthForm.invalid) return;
        console.log(this.healthForm.getRawValue());
    }

    get injuriesControl() {
        return this.healthForm.get('injuries')! as FormControl<string[]>;
    }

    get movementRestrictionsControl() {
        return this.healthForm.get('movementRestrictions')! as FormControl<string[]>;
    }

    get conditionsControl() {
        return this.healthForm.get('conditions')! as FormControl<string[]>;
    }

    get mobilityLevelControl() {
        return this.healthForm.get('mobilityLevel')! as FormControl<string>;
    }

    get hasHealthcareSupervisionControl() {
        return this.healthForm.get('hasHealthcareSupervision')! as FormControl<boolean>;
    }
}
