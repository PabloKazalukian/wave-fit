import {
    Component,
    DestroyRef,
    inject,
    Input,
    OnChanges,
    OnInit,
    signal,
    SimpleChanges,
} from '@angular/core';
import { ExercisesService } from '../../../../../core/services/exercises/exercises.service';
import { Exercise } from '../../../../interfaces/exercise.interface';
import { Loading } from '../../../ui/loading/loading';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControlsOf } from '../../../../utils/form-types.util';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BtnComponent } from '../../../ui/btn/btn';
import { FormInputComponent } from '../../../ui/input/input';
import { RoutineDayCreate } from '../../../../interfaces/routines.interface';
import { RoutinesServices } from '../../../../../core/services/routines/routines.service';
import { ExerciseCreate } from '../../exercises/exercise-create/exercise-create';

type ExercisesType = FormControlsOf<{
    exercisesSelected: Exercise[];
    categoriesSelected: string[];
}>;

type RoutineDayType = FormControlsOf<RoutineDayCreate>;

@Component({
    selector: 'app-routine-exercise-form',
    standalone: true,
    imports: [Loading, ExerciseCreate, BtnComponent, FormInputComponent],
    templateUrl: './routine-exercise-form.html',
})
export class RoutineExerciseForm implements OnInit, OnChanges {
    private destroyRef = inject(DestroyRef);

    exercisesForm!: FormGroup<ExercisesType>;
    routineForm!: FormGroup<RoutineDayType>;

    @Input() categoryExercise!: string;

    loading = signal(true);
    exercises = signal<Exercise[]>([]);
    categories = signal<string[]>([]);

    showCreateExercise = signal(false);

    constructor(
        private exerciseSvc: ExercisesService,
        private routineSvc: RoutinesServices,
    ) {}

    ngOnInit(): void {
        this.exercisesForm = this.initForm();
        this.routineForm = this.initFormRoutine();

        setTimeout(() => {
            this.loading.set(false);
        }, 200);

        this.exerciseSvc
            .getExercises()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (value) => {
                    const valueFiltered: Exercise[] = value.filter(
                        (v) => v.category === this.categoryExercise,
                    );
                    this.exercises.set(valueFiltered);
                    this.loading.set(false);
                },
                error: () => this.loading.set(false),
            });
        this.exercisesForm.valueChanges.subscribe((val) => {
            this.routineForm.patchValue({ exercises: val.exercisesSelected });
            this.routineForm.patchValue({ type: val.categoriesSelected });
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['categoryExercise'] && !changes['categoryExercise'].firstChange) {
            const newCategory = this.categoryExercise;

            const allExercises = this.exerciseSvc.exercises();
            if (allExercises.length > 0) {
                const exerciseSelected: Exercise[] = this.exercisesSelected.value;

                this.exercises.set([
                    ...exerciseSelected,
                    ...allExercises.filter(
                        (e) => e.category === newCategory && !exerciseSelected.includes(e),
                    ),
                ]);
                return;
            }

            this.loading.set(true);
            this.exerciseSvc
                .getExercises()
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next: (value) => {
                        const filtered = value.filter((e) => e.category === newCategory);
                        this.exercises.set(filtered);
                        this.loading.set(false);
                    },
                    error: () => this.loading.set(false),
                });
        }
    }

    initForm(): FormGroup<ExercisesType> {
        return new FormGroup<ExercisesType>({
            exercisesSelected: new FormControl<Exercise[]>([], { nonNullable: true }),
            categoriesSelected: new FormControl<string[]>([], { nonNullable: true }),
        });
    }

    initFormRoutine(): FormGroup<RoutineDayType> {
        return new FormGroup<RoutineDayType>({
            title: new FormControl('', {
                nonNullable: true,
                validators: [Validators.required, Validators.minLength(3)],
            }),
            type: new FormControl([], { nonNullable: true }),
            exercises: new FormControl([], { nonNullable: true }),
        });
    }

    onSubmit(): void {
        console.log(this.routineForm.value);
        if (this.routineForm.invalid) {
            this.routineForm.markAllAsTouched();
            return;
        }
        const newRoutine = this.routineForm.value as RoutineDayCreate;
        this.routineSvc.createRoutine(newRoutine).subscribe({
            next: (res) => {
                console.log('Rutina creada:', res);
            },
            error: (err) => {
                console.error('Error al crear la rutina:', err);
            },
        });
    }

    toggleExercise(ex: Exercise) {
        this.updateExerciseSelection(ex);
        this.syncCategories();
    }

    private updateExerciseSelection(ex: Exercise) {
        const prev = this.exercisesSelected.value;

        if (prev.some((e) => e.id === ex.id)) {
            this.exercisesSelected.setValue(prev.filter((e) => e.id !== ex.id));
        } else {
            this.exercisesSelected.setValue([...prev, ex]);
        }
    }

    private syncCategories() {
        const selected = this.exercisesSelected.value;
        const unique = [...new Set(selected.map((e) => e.category))];

        this.categoriesSelected.setValue(unique);
        this.categories.set(unique);
    }

    removeAllCategory(category: string) {
        const withoutCat = this.currentCateogries().filter((c) => c !== category);

        this.exercisesForm.controls.categoriesSelected.setValue(withoutCat);
        this.categories.set(withoutCat);

        const exercisesFiltered = this.exercisesForm.controls.exercisesSelected.value.filter(
            (e) => e.category !== category,
        );
        this.exercisesForm.controls.exercisesSelected.setValue(exercisesFiltered);
    }

    currentCateogries = () => {
        return this.exercisesForm.controls.categoriesSelected.value;
    };

    countExercisesByCategory(category: string): number {
        return this.exercisesForm.controls.exercisesSelected.value.filter(
            (e) => e.category === category,
        ).length;
    }

    isSelected(ex: Exercise): boolean {
        return this.exercisesForm.controls.exercisesSelected.value.some((e) => e.id === ex.id);
    }

    changeShowExercise(): void {
        this.showCreateExercise.set(!this.showCreateExercise());
    }

    get exercisesSelected(): FormControl<Exercise[]> {
        return this.exercisesForm.get('exercisesSelected') as FormControl<Exercise[]>;
    }

    get categoriesSelected(): FormControl<string[]> {
        return this.exercisesForm.get('categoriesSelected') as FormControl<string[]>;
    }

    get titleControl(): FormControl<string> {
        return this.routineForm.get('title') as FormControl<string>;
    }
}
