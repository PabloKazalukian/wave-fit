import { AbstractControl, ValidatorFn } from '@angular/forms';
import { KindEnum } from '../interfaces/routines.interface';

export function routineDaysValidator(): ValidatorFn {
    return (group: AbstractControl) => {
        const days = group.get('routineDays')?.value;
        if (!Array.isArray(days) || days.length !== 7) {
            return { invalidDaysLength: true };
        }

        for (let i = 0; i < days.length; i++) {
            const d = days[i];
            if (!Object.values(KindEnum).includes(d?.kind)) {
                return { invalidKind: i };
            }

            if (d.kind === KindEnum.workout && (!d.id || !d.type)) {
                return { invalidWorkoutConfig: i };
            }
        }

        return null;
    };
}
