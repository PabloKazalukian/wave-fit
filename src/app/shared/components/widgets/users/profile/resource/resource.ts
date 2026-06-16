import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { FormControlsOf } from '../../../../../utils/form-types.util';

import { FormInputComponent } from '../../../../ui/input/input';
import { InputNumber } from '../../../../ui/input-number/input-number';
import { BtnComponent } from '../../../../ui/btn/btn';

export interface ResourceForm {
    trainingEnvironments: string[];

    equipment: string;

    dumbbellMaxKg: number;

    gymDistanceKm: number;
}

type ResourceFormType = FormControlsOf<ResourceForm>;

@Component({
    selector: 'app-resource',

    standalone: true,

    imports: [ReactiveFormsModule, FormInputComponent, InputNumber, BtnComponent],

    templateUrl: './resource.html',
})
export class Resource implements OnInit {
    resourceForm!: FormGroup<ResourceFormType>;

    ngOnInit(): void {
        this.resourceForm = this.initForm();
    }

    initForm(): FormGroup<ResourceFormType> {
        return new FormGroup<ResourceFormType>({
            trainingEnvironments: new FormControl([], {
                nonNullable: true,

                validators: [Validators.required],
            }),

            equipment: new FormControl('', {
                nonNullable: true,

                validators: [Validators.required],
            }),

            dumbbellMaxKg: new FormControl(0, {
                nonNullable: true,
            }),

            gymDistanceKm: new FormControl(0, {
                nonNullable: true,
            }),
        });
    }

    onSubmit() {
        if (this.resourceForm.invalid) return;

        console.log(this.resourceForm.getRawValue());
    }

    get trainingEnvironmentsControl() {
        return this.resourceForm.get('trainingEnvironments')! as FormControl<string[]>;
    }

    get equipmentControl() {
        return this.resourceForm.get('equipment')! as FormControl<string>;
    }

    get dumbbellMaxKgControl() {
        return this.resourceForm.get('dumbbellMaxKg')! as FormControl<number>;
    }

    get gymDistanceKmControl() {
        return this.resourceForm.get('gymDistanceKm')! as FormControl<number>;
    }
}
