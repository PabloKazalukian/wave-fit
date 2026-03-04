import { Component, effect, inject, input, OnInit, signal } from '@angular/core';
import { Exercise } from '../../../../interfaces/exercise.interface';
import { Loading } from '../../../ui/loading/loading';
import { FormControl } from '@angular/forms';
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
export class RoutineExerciseForm implements OnInit {
    facade = inject(RoutineExerciseFormFacade);
    private readonly routineSvc = inject(RoutinesServices);

    // input() signal reemplaza @Input() + ngOnChanges
    readonly categoryExercise = input.required<string>();

    showCreateExercise = signal(false);

    constructor() {
        // effect() reacciona automáticamente a cada cambio de categoryExercise
        // Se ejecuta también en la primera emisión, por eso podemos quitar ngOnInit para la carga inicial
        effect(() => {
            const category = this.categoryExercise();
            this.facade.onCategoryChange(category);
        });
    }

    ngOnInit(): void {
        // initRoutineFacade ya no necesita llamarse aquí porque el effect
        // del constructor maneja tanto la primera carga como los cambios.
        // Solo inicializamos el facade una vez para el form sync.
        this.facade.initRoutineFacade(this.categoryExercise());

        setTimeout(() => this.facade.loading.set(false), 200);
    }

    onSubmit(): void {
        this.facade.loadingCreate.set(true);

        if (this.facade.routineForm.invalid) {
            this.facade.routineForm.markAllAsTouched();
            this.facade.loadingCreate.set(false);
            return;
        }

        const newRoutine = this.facade.routineForm.value as RoutineDayCreate;

        this.routineSvc.createRoutine(newRoutine).subscribe({
            next: () => this.facade.loadingCreate.set(false),
            error: () => this.facade.loadingCreate.set(false),
        });
    }

    toggleExercise(ex: Exercise): void {
        this.updateExerciseSelection(ex);
        this.syncCategories();
    }

    private updateExerciseSelection(ex: Exercise): void {
        const prev = this.exercisesSelected.value;
        const isAlreadySelected = prev.some((e) => e.id === ex.id);

        this.exercisesSelected.setValue(
            isAlreadySelected ? prev.filter((e) => e.id !== ex.id) : [...prev, ex],
        );
    }

    private syncCategories(): void {
        const selected = this.exercisesSelected.value;
        const unique = [...new Set(selected.map((e) => e.category))];

        this.categoriesSelected.setValue(unique);
        this.facade.categories.set(unique);
    }

    removeAllCategory(category: string): void {
        const withoutCat = this.currentCategories().filter((c) => c !== category);

        this.facade.exercisesForm.controls.categoriesSelected.setValue(withoutCat);
        this.facade.categories.set(withoutCat);

        const exercisesFiltered = this.facade.exercisesForm.controls.exercisesSelected.value.filter(
            (e) => e.category !== category,
        );
        this.facade.exercisesForm.controls.exercisesSelected.setValue(exercisesFiltered);
    }

    currentCategories = (): string[] => {
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
        this.showCreateExercise.update((v) => !v);
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
