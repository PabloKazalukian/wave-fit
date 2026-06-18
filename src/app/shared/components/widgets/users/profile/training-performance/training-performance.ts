import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { FormControlsOf } from '../../../../../utils/form-types.util';

import { FormInputComponent } from '../../../../ui/input/input';
import { FormSelectComponent } from '../../../../ui/select/select';
import { SelectType } from '../../../../../interfaces/input.interface';
import { BtnComponent } from '../../../../ui/btn/btn';
import { UserProfileService } from '../../../../../../core/services/user/user-profile.service';
import {
    CardioPreference,
    IntensityPreference,
    TrainingStyle,
    UpdateTrainingPreferenceInput,
} from '../../../../../utils/profile.types';

export interface TrainingPerformanceForm {
    preferredStyles: TrainingStyle[];
    dislikedExercises: string[];
    favoriteExercises: string[];
    cardioPreference: CardioPreference;
    intensityPreference: IntensityPreference;
    workoutVibe: string;
}

type TrainingPerformanceFormType = FormControlsOf<TrainingPerformanceForm>;

@Component({
    selector: 'app-training-performance',
    standalone: true,
    imports: [ReactiveFormsModule, FormInputComponent, BtnComponent, FormSelectComponent],
    templateUrl: './training-performance.html',
})
export class TrainingPerformance implements OnInit {
    private destroyRef = inject(DestroyRef);
    private userProfileService = inject(UserProfileService);

    trainingForm!: FormGroup<TrainingPerformanceFormType>;

    cardioOptions: SelectType[] = [
        { name: 'Ninguno', value: 'none' },
        { name: 'Baja Intensidad', value: 'low_intensity' },
        { name: 'HIIT', value: 'hiit' },
        { name: 'Mixto', value: 'mixed' },
    ];

    intensityOptions: SelectType[] = [
        { name: 'Ligera', value: 'light' },
        { name: 'Moderada', value: 'moderate' },
        { name: 'Intensa', value: 'intense' },
        { name: 'Esfuerzo Máximo', value: 'max_effort' },
    ];

    ngOnInit(): void {
        this.trainingForm = this.initForm();
    }

    initForm(): FormGroup<TrainingPerformanceFormType> {
        return new FormGroup<TrainingPerformanceFormType>({
            preferredStyles: new FormControl([] as TrainingStyle[], {
                nonNullable: true,
                validators: [Validators.required],
            }),
            dislikedExercises: new FormControl([] as string[], { nonNullable: true }),
            favoriteExercises: new FormControl([] as string[], { nonNullable: true }),
            cardioPreference: new FormControl('' as CardioPreference, {
                nonNullable: true,
                validators: [Validators.required],
            }),
            intensityPreference: new FormControl('' as IntensityPreference, {
                nonNullable: true,
                validators: [Validators.required],
            }),
            workoutVibe: new FormControl('', { nonNullable: true }),
        });
    }

    onSubmit() {
        if (this.trainingForm.invalid) return;

        this.userProfileService
            .updateTrainingPreference(this.trainingForm.getRawValue())
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe();
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
