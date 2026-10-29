import { Component, Input, Output, EventEmitter, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { ExercisePerformanceVM } from '../../../../interfaces/tracking.interface';
import { ExercisesService } from '../../../../../core/services/exercises/exercises.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { wrapperExerciseAPItoVM } from '../../../../wrappers/exercises.wrapper';
import { UserProfileService } from '../../../../../core/services/user/user-profile.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
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
                animate('300ms ease-out', style({ opacity: 1, translateY: '0' })),
            ]),
            transition(':leave', [
                animate('200ms ease-in', style({ opacity: 0, translateY: '-10px' })),
            ]),
        ]),
    ],
})
export class ExerciseSelector {
    exercisesSvc = inject(ExercisesService);
    userProfileSvc = inject(UserProfileService);
    destroyRef = inject(DestroyRef);

    @Input() exercises: ExercisePerformanceVM[] = [];
    @Input() selectedExercises: ExercisePerformanceVM[] = [];
    @Input() set favoritesOnly(value: boolean) {
        this._favoritesOnly.set(value);
    }
    get favoritesOnly() {
        return this._favoritesOnly();
    }

    private _favoritesOnly = signal(false);

    @Output() toggleExerciseChange = new EventEmitter<ExercisePerformanceVM>();
    @Output() exercisesSelectedChange = new EventEmitter<ExercisePerformanceVM[]>();
    @Output() categoryToggle = new EventEmitter<string>();
    @Output() favoritesFilterToggle = new EventEmitter<void>();

    searchControl = new FormControl('', { nonNullable: true });
    categoryControl = new FormControl('', { nonNullable: true });
    showCreateForm = signal(false);
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

    // Renamed from 'exercises' to 'allExercises' to avoid conflict with @Input()
    allExercises = computed(() => wrapperExerciseAPItoVM(this.exercisesSvc.exercises()));

    filteredExercises = computed(() => {
        const search = this.searchControl.value?.toLowerCase() || '';
        const category = this.categoryControl.value;
        const favoritesOnly = this.favoritesOnly;
        const all = this.allExercises();

        return all.filter((ex) => {
            const matchesSearch = ex.name.toLowerCase().includes(search);
            const matchesCategory = !category || ex.category === category;
            const matchesFavorite = !favoritesOnly || ex.isFavorite;
            return matchesSearch && matchesCategory && matchesFavorite;
        });
    });

    constructor() {
        // Removed store-dependent effect; exercises loaded via exercisesSvc directly
        // Keep existing effect if needed for initial load
        effect(() => {
            const ex = this.allExercises();
            if (ex === null || ex.length === 0) {
                this.exercisesSvc
                    .getExercises()
                    .pipe(takeUntilDestroyed(this.destroyRef))
                    .subscribe();
            }
        });
    }

    toggleExercise(ex: ExercisePerformanceVM) {
        this.toggleExerciseChange.emit(ex);
    }

    toggleCategory(category: string) {
        if (this.categoryControl.value === category) {
            this.categoryControl.setValue('');
        } else {
            this.categoryControl.setValue(category);
        }
        this.categoryToggle.emit(category);
    }

    toggleFavoritesFilter() {
        this._favoritesOnly.update((prev) => !prev);
        this.favoritesFilterToggle.emit();
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
        return this.selectedExercises.some((e) => e.exerciseId === ex.exerciseId) || false;
    }
}