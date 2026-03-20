import { Component, computed, DestroyRef, effect, inject } from '@angular/core';
import { ExercisePerformanceVM } from '../../../../interfaces/tracking.interface';
import { ExercisesService } from '../../../../../core/services/exercises/exercises.service';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { wrapperExerciseAPItoVM } from '../../../../wrappers/exercises.wrapper';
import { WorkoutStateService } from '../../../../../core/services/workouts/workout.state';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { options } from '../../../../interfaces/input.interface';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
    selector: 'app-exercise-selector',
    standalone: true,
    imports: [ReactiveFormsModule, CommonModule],
    templateUrl: './exercise-selector.html',
    animations: [
        trigger('chipAnimation', [
            transition(':enter', [
                style({ opacity: 0, transform: 'scale(0.8)' }),
                animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1)' })),
            ]),
            transition(':leave', [
                animate('150ms ease-in', style({ opacity: 0, transform: 'scale(0.8)' })),
            ]),
        ]),
    ],
})
export class ExerciseSelector {
    exercisesSvc = inject(ExercisesService);
    state = inject(WorkoutStateService);
    destroyRef = inject(DestroyRef);

    searchControl = new FormControl('', { nonNullable: true });
    categoryControl = new FormControl('', { nonNullable: true });
    options = options;

    search = toSignal(this.searchControl.valueChanges, { initialValue: '' });
    category = toSignal(this.categoryControl.valueChanges, { initialValue: '' });

    exercises = computed(() => wrapperExerciseAPItoVM(this.exercisesSvc.exercises()));

    filteredExercises = computed(() => {
        const search = this.search().toLowerCase();
        const category = this.category();
        const all = this.exercises();

        return all.filter((ex) => {
            const matchesSearch = ex.name.toLowerCase().includes(search);
            const matchesCategory = !category || ex.category === category;
            return matchesSearch && matchesCategory;
        });
    });

    constructor() {
        effect(() => {
            const ex = this.exercises();
            if (ex === null || ex.length === 0) {
                this.exercisesSvc
                    .getExercises()
                    .pipe(takeUntilDestroyed(this.destroyRef))
                    .subscribe({
                        next: (res) => {
                            // this.exercises.set(wrapperExerciseAPItoVM(res));
                        },
                    });
            }
        });
    }

    readonly exercisesSelected = this.state.exercises;

    toggleExercise(ex: ExercisePerformanceVM) {
        const exists = this.exercisesSelected()?.some((e) => e.exerciseId === ex.exerciseId);
        if (exists) {
            this.state.updateExercises(
                this.exercisesSelected()?.filter((e) => e.exerciseId !== ex.exerciseId) || [],
            );
        } else {
            this.state.updateExercises([...(this.exercisesSelected() || []), ex]);
        }
    }

    toggleCategory(category: string) {
        if (this.category() === category) {
            this.categoryControl.setValue('');
        } else {
            this.categoryControl.setValue(category);
        }
    }

    isSelected(ex: ExercisePerformanceVM): boolean {
        return this.exercisesSelected()?.some((e) => e.exerciseId === ex.exerciseId) || false;
    }
}
