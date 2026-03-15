import {
    Component,
    effect,
    inject,
    input,
    OnInit,
    signal,
    Output,
    EventEmitter,
} from '@angular/core';
import { Exercise } from '../../../../interfaces/exercise.interface';
import { Loading } from '../../../ui/loading/loading';
import { FormControl } from '@angular/forms';
import { BtnComponent } from '../../../ui/btn/btn';
import { FormInputComponent } from '../../../ui/input/input';
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

    @Output() routineCreated = new EventEmitter<void>();

    readonly categoryExercise = input.required<string>();

    showCreateExercise = signal(false);

    constructor() {
        effect(() => {
            const category = this.categoryExercise();
            this.facade.onCategoryChange(category);
        });
    }

    ngOnInit(): void {
        this.facade.initRoutineFacade(this.categoryExercise());

        setTimeout(() => this.facade.loading.set(false), 200);
    }

    onSubmit(): void {
        this.facade.submitRoutine(() => {
            this.routineCreated.emit();
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
