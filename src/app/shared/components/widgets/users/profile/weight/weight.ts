import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { FormControlsOf } from '../../../../../utils/form-types.util';

import { UserProfileService } from '../../../../../../core/services/user/user-profile.service';

import { FormInputComponent } from '../../../../ui/input/input';
import { BtnComponent } from '../../../../ui/btn/btn';
import { InputNumber } from '../../../../ui/input-number/input-number';

export interface WeightLogForm {
    weightKg: number;

    bodyFatPct: number;

    loggedAt: string;

    notes: string;
}

type WeightLogFormType = FormControlsOf<WeightLogForm>;

@Component({
    selector: 'app-weight',
    standalone: true,
    imports: [ReactiveFormsModule, FormInputComponent, InputNumber, BtnComponent],
    templateUrl: './weight.html',
})
export class Weight implements OnInit {
    private destroyRef = inject(DestroyRef);

    private profileUserService = inject(UserProfileService);

    weightForm!: FormGroup<WeightLogFormType>;

    loading = false;

    success = false;

    ngOnInit(): void {
        this.weightForm = this.initForm();
    }

    initForm(): FormGroup<WeightLogFormType> {
        return new FormGroup<WeightLogFormType>({
            weightKg: new FormControl(0, {
                nonNullable: true,
                validators: [Validators.required, Validators.min(20)],
            }),

            bodyFatPct: new FormControl(0, {
                nonNullable: true,
                validators: [Validators.min(0), Validators.max(100)],
            }),

            loggedAt: new FormControl('', {
                nonNullable: true,
                validators: [Validators.required],
            }),

            notes: new FormControl('', {
                nonNullable: true,
            }),
        });
    }

    onSubmit() {
        if (this.weightForm.invalid) return;

        this.loading = true;

        // this.profileUserService
        //     .createWeightLog(this.weightForm.getRawValue())
        //     .pipe(takeUntilDestroyed(this.destroyRef))
        //     .subscribe({

        //         next:()=>{

        //             this.loading=false;
        //             this.success=true;

        //         },

        //         error:(err)=>{

        //             this.loading=false;
        //             console.error(err);

        //         }

        //     });
    }

    get weightKgControl(): FormControl<number> {
        return this.weightForm.get('weightKg')! as FormControl<number>;
    }

    get bodyFatPctControl(): FormControl<number> {
        return this.weightForm.get('bodyFatPct')! as FormControl<number>;
    }

    get loggedAtControl(): FormControl<string> {
        return this.weightForm.get('loggedAt')! as FormControl<string>;
    }

    get notesControl(): FormControl<string> {
        return this.weightForm.get('notes')! as FormControl<string>;
    }
}
