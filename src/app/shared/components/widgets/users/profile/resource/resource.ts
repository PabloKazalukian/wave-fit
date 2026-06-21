import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { FormControlsOf } from '../../../../../utils/form-types.util';

import { InputNumber } from '../../../../ui/input-number/input-number';
import { BtnComponent } from '../../../../ui/btn/btn';
import { UserProfileService } from '../../../../../../core/services/user/user-profile.service';
import {
    AvailableEquipment,
    TrainingEnvironment,
    UpdateResourceInput,
} from '../../../../../utils/profile.types';

type ResourceFormType = FormControlsOf<UpdateResourceInput>;

@Component({
    selector: 'app-resource',

    standalone: true,

    imports: [ReactiveFormsModule, InputNumber, BtnComponent],

    templateUrl: './resource.html',
})
export class Resource implements OnInit {
    private destroyRef = inject(DestroyRef);
    private userProfileService = inject(UserProfileService);

    resourceForm!: FormGroup<ResourceFormType>;

    ngOnInit(): void {
        this.resourceForm = this.initForm();

        this.userProfileService.userProfile$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((profile) => {
                if (!profile?.resources) return;
                this.resourceForm.patchValue({
                    trainingEnvironments: profile.resources
                        .trainingEnvironments as TrainingEnvironment[],
                    dumbbellMaxKg: profile.resources.dumbbellMaxKg || undefined,
                    gymDistanceKm: profile.resources.gymDistanceKm || undefined,
                });
            });
    }

    initForm(): FormGroup<ResourceFormType> {
        return new FormGroup<ResourceFormType>({
            trainingEnvironments: new FormControl([] as TrainingEnvironment[], {
                nonNullable: true,
                validators: [Validators.required],
            }),

            equipment: new FormControl({}, { nonNullable: true }),

            dumbbellMaxKg: new FormControl(undefined as unknown as number, {
                nonNullable: true,
            }),

            gymDistanceKm: new FormControl(undefined as unknown as number, {
                nonNullable: true,
            }),
        });
    }

    onSubmit() {
        if (this.resourceForm.invalid) return;

        this.userProfileService
            .updateResource(this.resourceForm.getRawValue())
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe();
    }

    get trainingEnvironmentsControl() {
        return this.resourceForm.get('trainingEnvironments')! as FormControl<string[]>;
    }

    get equipmentControl() {
        return this.resourceForm.get('equipment')! as FormControl<Partial<AvailableEquipment>>;
    }

    get dumbbellMaxKgControl() {
        return this.resourceForm.get('dumbbellMaxKg')! as FormControl<number>;
    }

    get gymDistanceKmControl() {
        return this.resourceForm.get('gymDistanceKm')! as FormControl<number>;
    }
}
