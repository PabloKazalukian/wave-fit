import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthService } from '../../../../../../core/services/auth/auth.service';
import { UserProfileService } from '../../../../../../core/services/user/user-profile.service';
import { FormInputComponent } from '../../../../ui/input/input';
import { BtnComponent } from '../../../../ui/btn/btn';
import { FormControlsOf } from '../../../../../utils/form-types.util';
import { InputNumber } from '../../../../ui/input-number/input-number';
import { UpdateProfileInput } from '../../../../../utils/profile.types';
import { FormSelectComponent } from '../../../../ui/select/select';
import { SelectType } from '../../../../../interfaces/input.interface';

type UserProfileFormType = FormControlsOf<UpdateProfileInput>;

@Component({
    selector: 'app-user-profile',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        FormInputComponent,
        BtnComponent,
        InputNumber,
        FormSelectComponent,
    ],
    templateUrl: './user-profile.html',
})
export class UserProfile implements OnInit {
    private destroyRef = inject(DestroyRef);

    private authService = inject(AuthService);
    private profileUserService = inject(UserProfileService);

    user = this.authService.user;

    profileForm!: FormGroup<UserProfileFormType>;

    loading = false;
    success = false;

    genderOptions: SelectType[] = [
        { name: 'Masculino', value: 'M' },
        { name: 'Femenino', value: 'F' },
        { name: 'Otro', value: 'other' },
    ];

    distributionOptions: SelectType[] = [
        { name: 'Semanal', value: 'Week-log' },
        { name: 'Diario', value: 'Day-log' },
    ];

    unitsOptions: SelectType[] = [
        { name: 'Métrico', value: 'metric' },
        { name: 'Imperial', value: 'imperial' },
    ];

    ngOnInit(): void {
        this.profileForm = this.initForm();

        this.authService.me().subscribe();

        this.profileUserService.userProfile$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((profile) => {
                // console.log(profile);

                if (!profile) return;
                this.profileForm.patchValue({
                    gender: profile.gender,
                    birthDate: profile.birthDate ? profile.birthDate.split('T')[0] : '',
                    heightCm: profile.heightCm,
                    weightKg: profile.weightKg,
                    bodyFatPct: profile.bodyFatPct || 0,
                    distributionDays: profile.distributionDays,
                    unitsPreference: profile.unitsPreference,
                });
            });
    }

    initForm(): FormGroup<UserProfileFormType> {
        return new FormGroup<UserProfileFormType>({
            gender: new FormControl('M', {
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

            bodyFatPct: new FormControl(0, {
                nonNullable: true,
            }),

            distributionDays: new FormControl('Week-log', {
                nonNullable: true,
            }),

            unitsPreference: new FormControl('metric', {
                nonNullable: true,
            }),
        });
    }

    onSubmit() {
        if (this.profileForm.invalid) return;

        this.loading = true;

        this.profileUserService
            .updateProfile(this.profileForm.getRawValue())
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.loading = false;
                    this.success = true;
                },

                error: (err) => {
                    this.loading = false;
                    console.error(err);
                },
            });
    }

    get genderControl(): FormControl<string> {
        return this.profileForm.get('gender')! as FormControl<string>;
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

    get bodyFatPctControl(): FormControl<number> {
        return this.profileForm.get('bodyFatPct')! as FormControl<number>;
    }

    get distributionDaysControl(): FormControl<string> {
        return this.profileForm.get('distributionDays')! as FormControl<string>;
    }

    get unitsPreferenceControl(): FormControl<string> {
        return this.profileForm.get('unitsPreference')! as FormControl<string>;
    }
}
