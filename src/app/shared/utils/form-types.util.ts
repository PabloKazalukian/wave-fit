import { FormControl } from '@angular/forms';

export type FormControlsOf<T> = {
    [K in keyof T]: FormControl<T[K]>;
};

export function extractField<
    TQuery extends Record<string, any>,
    TField extends keyof TQuery,
    TResult = TQuery[TField]
>(data: TQuery, field: TField): TResult {
    return data[field];
}
