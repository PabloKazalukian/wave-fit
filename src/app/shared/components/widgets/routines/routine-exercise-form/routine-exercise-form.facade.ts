import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { FormControlsOf } from '../../../../utils/form-types.util';
import { Exercise } from '../../../../interfaces/exercise.interface';
import { RoutineDayCreate } from '../../../../interfaces/routines.interface';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { requiredArray } from '../../../../validators/array.validator';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ExercisesService } from '../../../../../core/services/exercises/exercises.service';

type ExercisesType = FormControlsOf<{
    exercisesSelected: Exercise[];
    categoriesSelected: string[];
}>;

type RoutineDayType = FormControlsOf<RoutineDayCreate>;

@Injectable()
export class RoutineExerciseFormFacade {
    private destroyRef = inject(DestroyRef);

    routineForm = new FormGroup<RoutineDayType>({
        title: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required, Validators.minLength(3)],
        }),
        type: new FormControl([], { nonNullable: true }),
        exercises: new FormControl([], {
            nonNullable: true,
            validators: [requiredArray],
        }),
    });

    exercisesForm = new FormGroup<ExercisesType>({
        exercisesSelected: new FormControl<Exercise[]>([], { nonNullable: true }),
        categoriesSelected: new FormControl<string[]>([], { nonNullable: true }),
    });

    loading = signal(true);
    loadingCreate = signal(false);
    exercises = signal<Exercise[]>([]);
    categories = signal<string[]>([]);

    showCreateExercise = signal(false);

    constructor(private exerciseSvc: ExercisesService) {}

    initRoutineFacade(categoryExercise: string) {
        this.exerciseSvc
            .getExercises()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (value) => {
                    console.log(value, categoryExercise);
                    const valueFiltered: Exercise[] = value.filter(
                        (v) => v.category === categoryExercise,
                    );
                    this.exercises.set(valueFiltered);
                    this.loading.set(false);
                },
                error: () => this.loading.set(false),
            });
        this.exercisesForm.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((val) => {
                this.routineForm.patchValue({ exercises: val.exercisesSelected });
                this.routineForm.patchValue({ type: val.categoriesSelected });
            });
    }
}
