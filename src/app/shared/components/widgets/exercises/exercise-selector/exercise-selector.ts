import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { ExercisePerformanceVM } from '../../../../interfaces/tracking.interface';
import { ExercisesService } from '../../../../../core/services/exercises/exercises.service';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { wrapperExerciseAPItoVM } from '../../../../wrappers/exercises.wrapper';
import { WorkoutStateService } from '../../../../../core/services/workouts/workout.state';
import { UserProfileService } from '../../../../../core/services/user/user-profile.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { options } from '../../../../interfaces/input.interface';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { ExerciseCategoryPipe } from '../../../../pipes/exercise-category.pipe';
import { ExerciseCreate } from '../exercise-create/exercise-create';

@Component({
    selector: 'app-exercise-selector',
    standalone: true,
    imports: [ReactiveFormsModule, CommonModule, ExerciseCategoryPipe, ExerciseCreate],
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
        trigger('fadeAnimation', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateY(10px)' }),
                animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
            ]),
            transition(':leave', [
                animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' })),
            ]),
        ]),
    ],
})
export class ExerciseSelector {
    exercisesSvc = inject(ExercisesService);
    userProfileSvc = inject(UserProfileService);
    state = inject(WorkoutStateService);
    destroyRef = inject(DestroyRef);

    searchControl = new FormControl('', { nonNullable: true });
    categoryControl = new FormControl('', { nonNullable: true });
    options = options;

    search = toSignal(this.searchControl.valueChanges, { initialValue: '' });
    category = toSignal(
        this.categoryControl.valueChanges.pipe(startWith(this.categoryControl.value)),
        { initialValue: this.categoryControl.value },
    );
    showCreateForm = signal(false);
    favoritesOnly = signal(false);
    pendingFavoriteIds = signal<Set<string>>(new Set());

    toggleCreateForm() {
        this.showCreateForm.set(!this.showCreateForm());
    }

    onExerciseCreated() {
        this.exercisesSvc
            .getExercises(true)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => this.toggleCreateForm(),
                error: () => this.toggleCreateForm(),
            });
    }

    exercises = computed(() => wrapperExerciseAPItoVM(this.exercisesSvc.exercises()));

    filteredExercises = computed(() => {
        const search = this.search().toLowerCase();
        const category = this.category();
        const favoritesOnly = this.favoritesOnly();
        const all = this.exercises();

        return all.filter((ex) => {
            const matchesSearch = ex.name.toLowerCase().includes(search);
            const matchesCategory = !category || ex.category === category;
            const matchesFavorite = !favoritesOnly || ex.isFavorite;
            return matchesSearch && matchesCategory && matchesFavorite;
        });
    });

    constructor() {
        effect(() => {
            const ex = this.exercises();
            if (ex === null || ex.length === 0) {
                this.exercisesSvc
                    .getExercises()
                    .pipe(takeUntilDestroyed(this.destroyRef))
                    .subscribe();
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

    toggleFavoritesFilter() {
        this.favoritesOnly.set(!this.favoritesOnly());
    }

    isFavoritePending(exerciseId: string): boolean {
        return this.pendingFavoriteIds().has(exerciseId);
    }

    toggleFavorite(event: Event, ex: ExercisePerformanceVM) {
        event.stopPropagation();
        event.preventDefault();
        if (this.isFavoritePending(ex.exerciseId)) return;

        const newValue = !ex.isFavorite;
        this.exercisesSvc.setIsFavorite(ex.exerciseId, newValue);
        this.setPending(ex.exerciseId, true);

        this.userProfileSvc
            .toggleFavoriteExercise(ex.exerciseId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                error: () => this.exercisesSvc.setIsFavorite(ex.exerciseId, !newValue),
                complete: () => this.setPending(ex.exerciseId, false),
            });
    }

    private setPending(exerciseId: string, pending: boolean) {
        this.pendingFavoriteIds.update((prev) => {
            const next = new Set(prev);
            if (pending) {
                next.add(exerciseId);
            } else {
                next.delete(exerciseId);
            }
            return next;
        });
    }

    isSelected(ex: ExercisePerformanceVM): boolean {
        return this.exercisesSelected()?.some((e) => e.exerciseId === ex.exerciseId) || false;
    }
}
