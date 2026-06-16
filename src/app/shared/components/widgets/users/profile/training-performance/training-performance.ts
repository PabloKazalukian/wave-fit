import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { FormControlsOf } from '../../../../../utils/form-types.util';

import { FormInputComponent } from '../../../../ui/input/input';
import { BtnComponent } from '../../../../ui/btn/btn';

export interface TrainingPerformanceForm {
    preferredStyles: string[];
    dislikedExercises: string[];
    favoriteExercises: string[];
    cardioPreference: string;
    intensityPreference: string;
    workoutVibe: string;
}

type TrainingPerformanceFormType = FormControlsOf<TrainingPerformanceForm>;

@Component({
    selector: 'app-training-performance',
    standalone: true,
    imports: [ReactiveFormsModule, FormInputComponent, BtnComponent],
    templateUrl: './training-performance.html',
})
export class TrainingPerformance implements OnInit {
    trainingForm!: FormGroup<TrainingPerformanceFormType>;

    ngOnInit(): void {
        this.trainingForm = this.initForm();
    }

    initForm(): FormGroup<TrainingPerformanceFormType> {
        return new FormGroup<TrainingPerformanceFormType>({
            preferredStyles: new FormControl([], {
                nonNullable: true,
                validators: [Validators.required],
            }),
            dislikedExercises: new FormControl([], { nonNullable: true }),
            favoriteExercises: new FormControl([], { nonNullable: true }),
            cardioPreference: new FormControl('', {
                nonNullable: true,
                validators: [Validators.required],
            }),
            intensityPreference: new FormControl('', {
                nonNullable: true,
                validators: [Validators.required],
            }),
            workoutVibe: new FormControl('', { nonNullable: true }),
        });
    }

    onSubmit() {
        if (this.trainingForm.invalid) return;

        const payload = this.trainingForm.getRawValue();

        console.log(payload);
    }

    get preferredStylesControl() {
        return this.trainingForm.get('preferredStyles')! as FormControl<string[]>;
    }

    get dislikedExercisesControl() {
        return this.trainingForm.get('dislikedExercises')! as FormControl<string[]>;
    }

    get favoriteExercisesControl() {
        return this.trainingForm.get('favoriteExercises')! as FormControl<string[]>;
    }

    get cardioPreferenceControl() {
        return this.trainingForm.get('cardioPreference')! as FormControl<string>;
    }

    get intensityPreferenceControl() {
        return this.trainingForm.get('intensityPreference')! as FormControl<string>;
    }

    get workoutVibeControl() {
        return this.trainingForm.get('workoutVibe')! as FormControl<string>;
    }
}
