import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { FormControlsOf } from '../../../../../utils/form-types.util';

import { FormInputComponent } from '../../../../ui/input/input';
import { FormSelectComponent } from '../../../../ui/select/select';
import { MultiSelectComponent } from '../../../../ui/multi-select/multi-select';
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
    cardioPreference: CardioPreference;
    intensityPreference: IntensityPreference;
    workoutVibe: string;
}

type TrainingPerformanceFormType = FormControlsOf<TrainingPerformanceForm>;

@Component({
    selector: 'app-training-performance',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        FormInputComponent,
        BtnComponent,
        FormSelectComponent,
        MultiSelectComponent,
    ],
    templateUrl: './training-performance.html',
})
export class TrainingPerformance implements OnInit {
    private destroyRef = inject(DestroyRef);
    private userProfileService = inject(UserProfileService);

    trainingForm!: FormGroup<TrainingPerformanceFormType>;

    preferredStylesOptions: SelectType[] = [
        { name: 'Powerlifting', value: 'powerlifting' },
        { name: 'Hipertrofia', value: 'hypertrophy' },
        { name: 'HIIT', value: 'hiit' },
        { name: 'Circuito', value: 'circuit' },
        { name: 'Funcional', value: 'functional' },
        { name: 'Pilates', value: 'pilates' },
        { name: 'Yoga', value: 'yoga' },
        { name: 'Calistenia', value: 'calisthenics' },
        { name: 'Cardio', value: 'cardio' },
        { name: 'CrossFit', value: 'crossfit' },
    ];

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

        this.userProfileService.userProfile$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((profile) => {
                if (!profile?.trainingPreferences) return;
                this.trainingForm.patchValue({
                    preferredStyles: profile.trainingPreferences.preferredStyles || [],
                    cardioPreference: profile.trainingPreferences.cardioPreference || undefined,
                    intensityPreference:
                        profile.trainingPreferences.intensityPreference || undefined,
                    workoutVibe: profile.trainingPreferences.workoutVibe || '',
                });
            });
    }

    initForm(): FormGroup<TrainingPerformanceFormType> {
        return new FormGroup<TrainingPerformanceFormType>({
            preferredStyles: new FormControl([] as TrainingStyle[], {
                nonNullable: true,
            }),
            cardioPreference: new FormControl('' as CardioPreference, {
                nonNullable: true,
            }),
            intensityPreference: new FormControl('' as IntensityPreference, {
                nonNullable: true,
            }),
            workoutVibe: new FormControl('', { nonNullable: true }),
        });
    }

    onSubmit() {
        const raw = this.trainingForm.getRawValue();
        const payload: UpdateTrainingPreferenceInput = {
            preferredStyles: raw.preferredStyles,
        };
        if (raw.cardioPreference) payload.cardioPreference = raw.cardioPreference;
        if (raw.intensityPreference) payload.intensityPreference = raw.intensityPreference;
        if (raw.workoutVibe) payload.workoutVibe = raw.workoutVibe;

        this.userProfileService
            .updateTrainingPreference(payload)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe();
    }

    get preferredStylesControl() {
        return this.trainingForm.get('preferredStyles')! as FormControl<(string | number)[]>;
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
