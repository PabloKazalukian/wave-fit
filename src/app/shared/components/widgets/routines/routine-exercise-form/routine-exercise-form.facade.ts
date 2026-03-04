import {
    computed,
    DestroyRef,
    effect,
    inject,
    Injectable,
    Injector,
    input,
    signal,
} from '@angular/core';
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
    private readonly exerciseSvc = inject(ExercisesService);
    private readonly injector = inject(Injector);

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

    // Signal de categoría activa, se setea desde el componente vía initRoutineFacade
    private readonly activeCategory = signal<string>('');

    initRoutineFacade(categoryExercise: string): void {
        this.activeCategory.set(categoryExercise);
        this._loadInitialExercises(categoryExercise);
        this._syncFormValues();
    }

    /**
     * Llamado desde el componente cuando cambia el @Input categoryExercise.
     * Filtra ejercicios ya cargados o hace fetch si no hay ninguno aún.
     */
    onCategoryChange(newCategory: string): void {
        this.activeCategory.set(newCategory);

        const allExercises = this.exerciseSvc.exercises();

        if (allExercises.length > 0) {
            this._filterExercisesLocally(newCategory, allExercises);
            return;
        }

        this._fetchAndFilterExercises(newCategory);
    }

    private _loadInitialExercises(categoryExercise: string): void {
        this.exerciseSvc
            .getExercises()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (exercises) => {
                    this.exercises.set(exercises.filter((e) => e.category === categoryExercise));
                    this.loading.set(false);
                },
                error: () => this.loading.set(false),
            });
    }

    private _syncFormValues(): void {
        this.exercisesForm.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((val) => {
                this.routineForm.patchValue({
                    exercises: val.exercisesSelected,
                    type: val.categoriesSelected,
                });
            });
    }

    private _filterExercisesLocally(category: string, allExercises: Exercise[]): void {
        const selected: Exercise[] = this.exercisesForm.controls.exercisesSelected.value;

        this.exercises.set([
            ...selected,
            ...allExercises.filter((e) => e.category === category && !selected.includes(e)),
        ]);
    }

    private _fetchAndFilterExercises(category: string): void {
        this.loading.set(true);
        this.exerciseSvc
            .getExercises()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (exercises) => {
                    this.exercises.set(exercises.filter((e) => e.category === category));
                    this.loading.set(false);
                },
                error: () => this.loading.set(false),
            });
    }
}
