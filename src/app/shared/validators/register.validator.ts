import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { debounceTime, distinctUntilChanged, map, switchMap, take } from 'rxjs/operators';
import { timer } from 'rxjs';
import { AuthService } from '../../core/services/auth/auth.service';

export function emailAvailableValidator(authSvc: AuthService): AsyncValidatorFn {
    return (control: AbstractControl) => {
        if (!control.value || control.invalid) return Promise.resolve(null);

        return timer(500).pipe(
            debounceTime(500),
            distinctUntilChanged(),
            switchMap(() => authSvc.isEmailAvailable(control.value)),
            map((isAvailable) => (isAvailable ? null : { emailTaken: true })),
            take(1),
        );
    };
}
