import { AbstractControl, ValidationErrors } from '@angular/forms';

export function requiredArray(control: AbstractControl): ValidationErrors | null {
    const value = control.value as unknown[];

    return Array.isArray(value) && value.length > 0 ? null : { requiredArray: true };
}
