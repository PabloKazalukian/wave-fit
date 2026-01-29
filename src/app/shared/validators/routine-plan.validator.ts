import { AbstractControl, ValidatorFn } from '@angular/forms';

export function routinePlanValidator(): ValidatorFn {
    return (group: AbstractControl) => {
        const days = group.get('routineDays')?.value;
        const weekly_distribution = group.get('weekly_distribution')?.value;

        if (!Array.isArray(days) || days.length !== 7) {
            return { invalidDaysLength: true };
        }

        return null;
    };
}
