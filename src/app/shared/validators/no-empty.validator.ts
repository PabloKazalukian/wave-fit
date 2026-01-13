import { AbstractControl, ValidationErrors } from '@angular/forms';

export function noEmpty(control: AbstractControl): ValidationErrors | null {
    const value = control.value;

    // null o undefined
    if (value === null || value === undefined) {
        return { noEmpty: true };
    }

    // string
    if (typeof value === 'string') {
        return value.trim().length > 0 ? null : { noEmpty: true };
    }

    // array
    if (Array.isArray(value)) {
        return value.length > 0 ? null : { noEmpty: true };
    }

    // objeto
    if (typeof value === 'object') {
        return Object.keys(value).length > 0 ? null : { noEmpty: true };
    }

    // number (NaN es inválido)
    if (typeof value === 'number') {
        return Number.isNaN(value) ? { noEmpty: true } : null;
    }

    // boolean → siempre válido
    if (typeof value === 'boolean') {
        return null;
    }

    return null;
}
