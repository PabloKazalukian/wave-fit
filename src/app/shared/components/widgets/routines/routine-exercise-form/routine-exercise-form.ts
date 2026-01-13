import {
    Component,
    DestroyRef,
    inject,
    Input,
    OnChanges,
    OnInit,
    signal,
    SimpleChanges,
    WritableSignal,
} from '@angular/core';
import { ExercisesService } from '../../../../../core/services/exercises/exercises.service';
import { Exercise } from '../../../../interfaces/exercise.interface';
import { Loading } from '../../../ui/loading/loading';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup } from '@angular/forms';
import { BtnComponent } from '../../../ui/btn/btn';
import { FormInputComponent } from '../../../ui/input/input';
import { RoutineDayCreate } from '../../../../interfaces/routines.interface';
import { RoutinesServices } from '../../../../../core/services/routines/routines.service';
import { ExerciseCreate } from '../../exercises/exercise-create/exercise-create';
import { RoutineExerciseFormFacade } from './routine-exercise-form.facade';

@Component({
    selector: 'app-routine-exercise-form',
    standalone: true,
    imports: [Loading, ExerciseCreate, BtnComponent, FormInputComponent],
    templateUrl: './routine-exercise-form.html',
    providers: [RoutineExerciseFormFacade],
})
export class RoutineExerciseForm implements OnInit, OnChanges {
    private destroyRef = inject(DestroyRef);
    facade = inject(RoutineExerciseFormFacade);

    @Input() categoryExercise!: string;

    showCreateExercise = signal(false);

    constructor(
        private exerciseSvc: ExercisesService,
        private routineSvc: RoutinesServices,
    ) {}

    ngOnInit(): void {
        setTimeout(() => {
            this.facade.loading.set(false);
        }, 200);

        this.facade.initRoutineFacade(this.categoryExercise);
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['categoryExercise'] && !changes['categoryExercise'].firstChange) {
            const newCategory = this.categoryExercise;

            const allExercises = this.exerciseSvc.exercises();
            if (allExercises.length > 0) {
                const exerciseSelected: Exercise[] = this.exercisesSelected.value;

                this.facade.exercises.set([
                    ...exerciseSelected,
                    ...allExercises.filter(
                        (e) => e.category === newCategory && !exerciseSelected.includes(e),
                    ),
                ]);
                return;
            }

            this.facade.loading.set(true);
            this.exerciseSvc
                .getExercises()
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next: (value) => {
                        const filtered = value.filter((e) => e.category === newCategory);
                        this.facade.exercises.set(filtered);
                        this.facade.loading.set(false);
                    },
                    error: () => this.facade.loading.set(false),
                });
        }
    }

    onSubmit(): void {
        this.facade.loadingCreate.set(true);
        console.log(this.facade.routineForm.value);
        if (this.facade.routineForm.invalid) {
            this.facade.routineForm.markAllAsTouched();
            this.facade.loadingCreate.set(false);

            return;
        }
        const newRoutine = this.facade.routineForm.value as RoutineDayCreate;
        this.routineSvc.createRoutine(newRoutine).subscribe({
            next: (res) => {
                console.log('Rutina creada:', res);
                this.facade.loadingCreate.set(false);
            },
            error: (err) => {
                console.error('Error al crear la rutina:', err);
                this.facade.loadingCreate.set(false);
            },
            complete: () => {
                this.facade.loadingCreate.set(false);
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
        this.facade.categories.set(unique);
    }

    removeAllCategory(category: string) {
        const withoutCat = this.currentCateogries().filter((c) => c !== category);

        this.facade.exercisesForm.controls.categoriesSelected.setValue(withoutCat);
        this.facade.categories.set(withoutCat);

        const exercisesFiltered = this.facade.exercisesForm.controls.exercisesSelected.value.filter(
            (e) => e.category !== category,
        );
        this.facade.exercisesForm.controls.exercisesSelected.setValue(exercisesFiltered);
    }

    currentCateogries = () => {
        return this.facade.exercisesForm.controls.categoriesSelected.value;
    };

    countExercisesByCategory(category: string): number {
        return this.facade.exercisesForm.controls.exercisesSelected.value.filter(
            (e) => e.category === category,
        ).length;
    }

    isSelected(ex: Exercise): boolean {
        return this.facade.exercisesForm.controls.exercisesSelected.value.some(
            (e) => e.id === ex.id,
        );
    }

    changeShowExercise(): void {
        this.showCreateExercise.set(!this.showCreateExercise());
    }

    get exercisesSelected(): FormControl<Exercise[]> {
        return this.facade.exercisesForm.get('exercisesSelected') as FormControl<Exercise[]>;
    }

    get categoriesSelected(): FormControl<string[]> {
        return this.facade.exercisesForm.get('categoriesSelected') as FormControl<string[]>;
    }

    get titleControl(): FormControl<string> {
        return this.facade.routineForm.get('title') as FormControl<string>;
    }
}
