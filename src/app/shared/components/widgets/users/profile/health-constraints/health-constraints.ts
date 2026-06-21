import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControlsOf } from '../../../../../utils/form-types.util';
import { FormSelectComponent } from '../../../../ui/select/select';
import { SelectType } from '../../../../../interfaces/input.interface';
import { BtnComponent } from '../../../../ui/btn/btn';
import { UserProfileService } from '../../../../../../core/services/user/user-profile.service';
import {
    Injury,
    MobilityLevel,
    UpdateHealthConstraintsInput,
} from '../../../../../utils/profile.types';

type HealthConstraintFormType = FormControlsOf<UpdateHealthConstraintsInput>;

@Component({
    selector: 'app-health-constraints',
    standalone: true,
    imports: [ReactiveFormsModule, BtnComponent, FormSelectComponent],
    templateUrl: './health-constraints.html',
})
export class HealthConstraints implements OnInit {
    private destroyRef = inject(DestroyRef);
    private userProfileService = inject(UserProfileService);

    healthForm!: FormGroup<HealthConstraintFormType>;

    mobilityLevelOptions: SelectType[] = [
        { name: 'Limitada', value: 'limited' },
        { name: 'Moderada', value: 'moderate' },
        { name: 'Buena', value: 'good' },
        { name: 'Excelente', value: 'excellent' },
    ];

    ngOnInit(): void {
        this.healthForm = this.initForm();

        this.userProfileService.userProfile$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((profile) => {
                if (!profile?.healthConstraints) return;
                this.healthForm.patchValue({
                    injuries: profile.healthConstraints.injuries || [],
                    movementRestrictions: profile.healthConstraints.movementRestrictions || [],
                    conditions: profile.healthConstraints.conditions || [],
                    mobilityLevel: profile.healthConstraints.mobilityLevel as MobilityLevel,
                    hasHealthcareSupervision: profile.healthConstraints.hasHealthcareSupervision,
                });
            });
    }

    initForm(): FormGroup<HealthConstraintFormType> {
        return new FormGroup<HealthConstraintFormType>({
            injuries: new FormControl([], { nonNullable: true }),
            movementRestrictions: new FormControl([], { nonNullable: true }),
            conditions: new FormControl([], { nonNullable: true }),
            mobilityLevel: new FormControl('' as MobilityLevel, {
                nonNullable: true,
                validators: [Validators.required],
            }),
            hasHealthcareSupervision: new FormControl(false, { nonNullable: true }),
        });
    }

    onSubmit() {
        if (this.healthForm.invalid) return;
        this.userProfileService
            .updateHealthConstraints(this.healthForm.getRawValue())
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe();
    }

    get injuriesControl() {
        return this.healthForm.get('injuries')! as FormControl<Injury[]>;
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
