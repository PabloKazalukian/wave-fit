import { Component, DestroyRef, inject, OnInit, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { UserProfileService } from '../../../../../core/services/user/user-profile.service';
import { FormInputComponent } from '../../../ui/input/input';
import { BtnComponent } from '../../../ui/btn/btn';
import { SpinnerComponent } from '../../../ui/icon/spinner';
import { InputNumber } from '../../../ui/input-number/input-number';
import { FormSelectComponent } from '../../../ui/select/select';
import { SelectType } from '../../../../interfaces/input.interface';
import { PrimaryGoal, TrainingExperience, Gender } from '../../../../utils/profile.types';

interface CoachProfileFormType {
    gender: FormControl<Gender | ''>;
    birthDate: FormControl<string>;
    heightCm: FormControl<number>;
    weightKg: FormControl<number>;
    primaryGoal: FormControl<PrimaryGoal | ''>;
    daysPerWeek: FormControl<string>;
    trainingExperience: FormControl<TrainingExperience | ''>;
}

@Component({
    selector: 'app-form-user-profile',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        FormInputComponent,
        BtnComponent,
        SpinnerComponent,
        InputNumber,
        FormSelectComponent,
    ],
    templateUrl: './form-user-profile.html',
    styles: ``,
})
export class FormUserProfile implements OnInit {
    private destroyRef = inject(DestroyRef);
    private profileUserService = inject(UserProfileService);

    profileForm!: FormGroup<CoachProfileFormType>;

    /** Se emite cuando todos los pasos del setup se guardaron correctamente. */
    readonly completed = output<void>();

    saving = signal(false);
    success = signal(false);
    errorMessage = signal<string | null>(null);

    genderOptions: SelectType[] = [
        { name: 'Masculino', value: 'M' },
        { name: 'Femenino', value: 'F' },
        { name: 'Otro', value: 'other' },
    ];

    primaryGoalOptions: SelectType[] = [
        { name: 'Pérdida de grasa', value: 'fat_loss' },
        { name: 'Ganancia muscular', value: 'muscle_gain' },
        { name: 'Fuerza', value: 'strength' },
        { name: 'Resistencia', value: 'endurance' },
        { name: 'Mantenimiento', value: 'maintenance' },
        { name: 'Recomposición corporal', value: 'recomp' },
    ];

    daysPerWeekOptions: SelectType[] = Array.from({ length: 7 }, (_, i) => ({
        name: `${i + 1}`,
        value: `${i + 1}`,
    }));

    trainingExperienceOptions: SelectType[] = [
        { name: 'Principiante', value: 'beginner' },
        { name: 'Intermedio', value: 'intermediate' },
        { name: 'Avanzado', value: 'advanced' },
        { name: 'Atleta', value: 'athlete' },
    ];

    ngOnInit(): void {
        this.profileForm = this.initForm();

        this.profileUserService.userProfile$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((profile) => {
                if (!profile) return;
                this.profileForm.patchValue({
                    gender: profile.gender || '',
                    birthDate: profile.birthDate ? profile.birthDate.split('T')[0] : '',
                    heightCm: profile.heightCm || 0,
                    weightKg: profile.weightKg || 0,
                    primaryGoal: profile.goal?.primaryGoal || '',
                    daysPerWeek: profile.schedule?.daysPerWeek
                        ? String(profile.schedule.daysPerWeek)
                        : '',
                    trainingExperience: profile.goal?.trainingExperience || '',
                });
            });
    }

    initForm(): FormGroup<CoachProfileFormType> {
        return new FormGroup<CoachProfileFormType>({
            gender: new FormControl('' as Gender | '', {
                nonNullable: true,
                validators: [Validators.required],
            }),
            birthDate: new FormControl('', {
                nonNullable: true,
                validators: [Validators.required],
            }),
            heightCm: new FormControl(0, {
                nonNullable: true,
                validators: [Validators.required, Validators.min(50)],
            }),
            weightKg: new FormControl(0, {
                nonNullable: true,
                validators: [Validators.required, Validators.min(20)],
            }),
            primaryGoal: new FormControl('' as PrimaryGoal | '', {
                nonNullable: true,
                validators: [Validators.required],
            }),
            daysPerWeek: new FormControl('', {
                nonNullable: true,
                validators: [Validators.required],
            }),
            trainingExperience: new FormControl('' as TrainingExperience | '', {
                nonNullable: true,
                validators: [Validators.required],
            }),
        });
    }

    onSubmit() {
        if (this.profileForm.invalid) {
            this.profileForm.markAllAsTouched();
            return;
        }

        if (this.saving()) return;

        this.success.set(false);
        this.errorMessage.set(null);
        this.saving.set(true);

        const values = this.profileForm.getRawValue();

        this.profileUserService
            .completeBasicSetup({
                profile: {
                    gender: values.gender as Gender,
                    birthDate: values.birthDate,
                    heightCm: values.heightCm,
                    weightKg: values.weightKg,
                },
                goals: {
                    primaryGoal: values.primaryGoal as PrimaryGoal,
                    trainingExperience: values.trainingExperience as TrainingExperience,
                },
                schedule: {
                    daysPerWeek: Number(values.daysPerWeek),
                },
            })
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                finalize(() => this.saving.set(false)),
            )
            .subscribe({
                next: ({ failedSteps }) => {
                    this.saving.set(false);
                    if (failedSteps.length > 0) {
                        this.errorMessage.set(
                            `Se guardaron tus datos parcialmente. Revisá estos campos e intentá de nuevo: ${failedSteps.join(', ')}.`,
                        );
                    } else {
                        this.success.set(true);
                        this.completed.emit();
                    }
                },
                error: () => {
                    this.saving.set(false);
                    this.errorMessage.set(
                        'No se pudieron guardar los datos. Verificá tu conexión e intentá de nuevo.',
                    );
                },
            });
    }

    get genderControl(): FormControl<Gender | ''> {
        return this.profileForm.get('gender')! as FormControl<Gender | ''>;
    }
    get birthDateControl(): FormControl<string> {
        return this.profileForm.get('birthDate')! as FormControl<string>;
    }
    get heightCmControl(): FormControl<number> {
        return this.profileForm.get('heightCm')! as FormControl<number>;
    }
    get weightKgControl(): FormControl<number> {
        return this.profileForm.get('weightKg')! as FormControl<number>;
    }
    get primaryGoalControl(): FormControl<PrimaryGoal | ''> {
        return this.profileForm.get('primaryGoal')! as FormControl<PrimaryGoal | ''>;
    }
    get daysPerWeekControl(): FormControl<string> {
        return this.profileForm.get('daysPerWeek')! as FormControl<string>;
    }
    get trainingExperienceControl(): FormControl<TrainingExperience | ''> {
        return this.profileForm.get('trainingExperience')! as FormControl<TrainingExperience | ''>;
    }
}
