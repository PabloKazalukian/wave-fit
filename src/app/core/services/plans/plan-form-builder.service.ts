import { Injectable } from '@angular/core';
import {
    AbstractControl,
    FormBuilder,
    FormControl,
    FormGroup,
    Validators,
    ValidatorFn,
} from '@angular/forms';
import { FormControlsOf } from '../../../shared/utils/form-types.util';
import { RoutineDay, RoutinePlanCreate } from '../../../shared/interfaces/routines.interface';

export type PlanFormType = FormControlsOf<RoutinePlanCreate>;

@Injectable({ providedIn: 'root' })
export class PlanFormBuilderService {
    constructor(private fb: FormBuilder) {}

    buildForm(): FormGroup<PlanFormType> {
        return this.fb.group<PlanFormType>(
            {
                name: new FormControl('', {
                    nonNullable: true,
                    validators: [
                        Validators.required,
                        Validators.minLength(3),
                        this.stringValidator(),
                    ],
                }),

                description: new FormControl('', {
                    nonNullable: true,
                    validators: [
                        this.stringValidator(true), // true = optional
                    ],
                }),

                weekly_distribution: new FormControl('', {
                    nonNullable: true,
                    validators: [Validators.required, this.weekRangeValidator()],
                }),

                routineDays: new FormControl<RoutineDay[]>([], {
                    nonNullable: true,
                }),

                createdBy: new FormControl('', {
                    nonNullable: true,
                }),
            },
            {
                validators: [this.daysMatchDistributionValidator()],
            },
        );
    }

    patchForm(form: FormGroup<PlanFormType>, data: Partial<RoutinePlanCreate>): void {
        form.patchValue(data, { emitEvent: false });
    }

    // -------------------------------------------------------------
    // FIELD VALIDATORS
    // -------------------------------------------------------------

    /**
     * name/description validator
     * - Required: only if optional=false
     * - Regex: allow letters, numbers, accents, spaces, punctuation
     */
    private stringValidator(optional = false): ValidatorFn {
        const regex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.,-]+$/;

        return (control: AbstractControl) => {
            const value = control.value;

            if (!optional && !value) return { required: true };
            if (!value) return null;

            return regex.test(value) ? null : { invalidString: true };
        };
    }

    /**
     * weekly_distribution must be between 1 and 7
     */
    private weekRangeValidator(): ValidatorFn {
        return (control: AbstractControl) => {
            const value = Number(control.value);

            if (isNaN(value)) return { invalidNumber: true };
            if (value < 1 || value > 7) return { outOfRange: true };

            return null;
        };
    }

    // -------------------------------------------------------------
    // CROSS-FIELD VALIDATORS
    // -------------------------------------------------------------

    /**
     * weekly_distribution === routineDays.length
     * Ensures selected number of days matches the actual assigned routines.
     */
    private daysMatchDistributionValidator(): ValidatorFn {
        return (group: AbstractControl) => {
            const dist = Number(group.get('weekly_distribution')?.value);
            const days = group.get('routineDays')?.value;

            if (!dist || !days) return null;

            return dist === days.length ? null : { distributionMismatch: true };
        };
    }
}
