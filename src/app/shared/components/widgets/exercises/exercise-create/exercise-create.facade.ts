import { DestroyRef, inject, Injectable } from '@angular/core';
import { ExercisesService } from '../../../../../core/services/exercises/exercises.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Exercise, ExerciseCategory } from '../../../../interfaces/exercise.interface';
import { options, SelectTypeInput } from '../../../../interfaces/input.interface';
import { FormControlsOf } from '../../../../utils/form-types.util';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export type RoutinePlanType = FormControlsOf<Exercise>;
export type selectFormType = FormControlsOf<SelectTypeInput>;

@Injectable()
export class ExerciseCreateFacade {
    private destroyRef = inject(DestroyRef);

    selectForm = new FormGroup<selectFormType>({
        option: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    });

    routineExerciseCreateForm = new FormGroup<RoutinePlanType>({
        name: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required, Validators.minLength(3)],
        }),
        description: new FormControl('', { nonNullable: true }),
        category: new FormControl(ExerciseCategory.BACK, {
            nonNullable: true,
            validators: [Validators.required],
        }),
        usesWeight: new FormControl(false, { nonNullable: true }),
    });

    options = options;

    constructor(private exerciseSvc: ExercisesService) {}

    onSubmit(): void {
        // this.loading.set(true);
        if (this.routineExerciseCreateForm.invalid && this.selectForm) {
            this.routineExerciseCreateForm.markAllAsTouched();
            console.log('fail');
            setTimeout(() => {
                // this.loading.set(false);
            }, 1000);
            return;
        }

        const newExercise: Exercise = this.routineExerciseCreateForm.value as Exercise;

        this.exerciseSvc
            .createExercise(newExercise)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    console.log('Exercise created successfully:', response);
                    // this.loading.set(false);
                    // this.complete.set(true);
                },
                error: (error) => {
                    // this.complete.set(false);

                    console.error('Error creating exercise:', error);
                },
                complete: () => {
                    // this.loading.set(false);
                },
            });
    }
}
