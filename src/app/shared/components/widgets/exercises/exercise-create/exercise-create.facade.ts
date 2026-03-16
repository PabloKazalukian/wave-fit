import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { ExercisesService } from '../../../../../core/services/exercises/exercises.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import {
    Exercise,
    ExerciseCategory,
    ExerciseForm,
} from '../../../../interfaces/exercise.interface';
import { options, SelectTypeInput } from '../../../../interfaces/input.interface';
import { FormControlsOf } from '../../../../utils/form-types.util';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { noEmpty } from '../../../../validators/no-empty.validator';

export type ExerciseType = FormControlsOf<ExerciseForm>;
export type selectFormType = FormControlsOf<SelectTypeInput>;
export type notificationType = 'success' | 'error' | 'info';
export enum notificationEnum {
    success = 'success',
    error = 'error',
    info = 'info',
}

@Injectable()
export class ExerciseCreateFacade {
    private destroyRef = inject(DestroyRef);

    selectForm = new FormGroup<selectFormType>({
        option: new FormControl('', {
            validators: [noEmpty],
            nonNullable: true,
        }),
    });

    routineExerciseCreateForm = new FormGroup<ExerciseType>({
        name: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required, Validators.minLength(3)],
        }),
        description: new FormControl('', { nonNullable: true }),
        category: new FormControl<ExerciseCategory | null>(null, {
            validators: [noEmpty],
        }),
        usesWeight: new FormControl(false, { nonNullable: true }),
    });

    options = options;

    loading = signal<boolean>(true);
    complete = signal<boolean | null>(null);
    showNotification = signal<boolean>(false);
    notification = signal<notificationType | ''>('');

    private readonly exerciseSvc = inject(ExercisesService);

    initFacade() {
        setTimeout(() => {
            this.loading.set(false);
            this.complete.set(true);
        }, 1000);
        this.selectForm.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((value) => {
                this.routineExerciseCreateForm.patchValue({
                    category: value.option as ExerciseCategory,
                });
            });
    }

    submit(): Observable<Exercise> | null {
        if (this.routineExerciseCreateForm.invalid || this.selectForm.invalid) {
            this.selectForm.markAllAsTouched();

            this.routineExerciseCreateForm.markAllAsTouched();
            setTimeout(() => {
                this.loading.set(false);
            }, 1000);
            return null;
        }

        const newExercise: Exercise = this.routineExerciseCreateForm.value as Exercise;
        if (this.routineExerciseCreateForm.value.category === null) {
            setTimeout(() => {
                this.loading.set(false);
            }, 1000);
            return null;
        }

        return this.exerciseSvc
            .createExercise(newExercise)
            .pipe(takeUntilDestroyed(this.destroyRef));
    }
}
