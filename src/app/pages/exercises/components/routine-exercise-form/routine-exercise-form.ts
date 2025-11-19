import {
    Component,
    computed,
    DestroyRef,
    inject,
    Input,
    OnChanges,
    OnInit,
    signal,
    SimpleChanges,
} from '@angular/core';
import { ExercisesService } from '../../../../core/services/exercises/exercises.service';
import { Exercise } from '../../../../shared/interfaces/exercise.interface';
import { Loading } from '../../../../shared/components/ui/loading/loading';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControlsOf } from '../../../../shared/utils/form-types.util';
import { FormControl, FormGroup } from '@angular/forms';
import { RoutineExerciseCreate } from '../routine-exercise-create/routine-exercise-create';

type ExercisesType = FormControlsOf<{
    exercisesSelected: Exercise[];
    categoriesSelected: string[];
}>;

@Component({
    selector: 'app-routine-exercise-form',
    standalone: true,
    imports: [Loading, RoutineExerciseCreate],
    templateUrl: './routine-exercise-form.html',
    styleUrl: './routine-exercise-form.css',
})
export class RoutineExerciseForm implements OnInit, OnChanges {
    private destroyRef = inject(DestroyRef);

    exercisesForm!: FormGroup<ExercisesType>;

    @Input() categoryExercise!: string;

    loading = signal(false);
    exercises = signal<Exercise[]>([]);
    categories = signal<string[]>([]);

    showCreateExercise = signal(false);

    constructor(private exerciseSvc: ExercisesService) {}

    ngOnInit(): void {
        this.exercisesForm = this.initForm();

        this.loading.set(true);

        this.exerciseSvc
            .getExercises()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (value) => {
                    const valueFiltered: Exercise[] = value.filter(
                        (v) => v.category === this.categoryExercise
                    );
                    this.exercises.set(valueFiltered);
                    this.loading.set(false);
                },
                error: () => this.loading.set(false),
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
                        (e) => e.category === newCategory && !exerciseSelected.includes(e)
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
            (e) => e.category !== category
        );
        this.exercisesForm.controls.exercisesSelected.setValue(exercisesFiltered);
    }

    currentCateogries = () => {
        return this.exercisesForm.controls.categoriesSelected.value;
    };

    countExercisesByCategory(category: string): number {
        return this.exercisesForm.controls.exercisesSelected.value.filter(
            (e) => e.category === category
        ).length;
    }

    isSelected(ex: Exercise): boolean {
        return this.exercisesForm.controls.exercisesSelected.value.some((e) => e.id === ex.id);
    }

    createExercise(): void {
        this.showCreateExercise.set(true);
    }

    get exercisesSelected(): FormControl<Exercise[]> {
        return this.exercisesForm.get('exercisesSelected') as FormControl<Exercise[]>;
    }

    get categoriesSelected(): FormControl<string[]> {
        return this.exercisesForm.get('categoriesSelected') as FormControl<string[]>;
    }
}
