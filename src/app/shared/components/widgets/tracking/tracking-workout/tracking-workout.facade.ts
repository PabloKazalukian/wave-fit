import { computed, DestroyRef, effect, inject, Injectable, signal } from '@angular/core';
import { ExercisesService } from '../../../../../core/services/exercises/exercises.service';
import { ExercisePerformanceVM } from '../../../../interfaces/tracking.interface';
import { PlanTrackingService } from '../../../../../core/services/trackings/plan-tracking.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, switchMap, tap } from 'rxjs';
import { FormControl, FormGroup } from '@angular/forms';
import { SelectType } from '../tracking-week/tracking-week';
import { WorkoutStateService } from '../../../../../core/services/workouts/workout-state.service';

@Injectable()
export class TrackingWorkoutFacade {
    destroyRef = inject(DestroyRef);
    exerciseSvc = inject(ExercisesService);
    trackingSvc = inject(PlanTrackingService);

    state = inject(WorkoutStateService);

    // loadingWorkout = this.trackingSvc.loadingWorkout
    loadings = computed(() => this.trackingSvc.loadingWorkout().state === true);

    exerciseForm = new FormGroup<SelectType>({
        option: new FormControl('', {
            nonNullable: true,
        }),
    });

    readonly workoutDate = this.state.selectedDate;
    readonly workoutVM = this.state.workoutSession;

    validateWorkout(): boolean {
        if (
            this.exercisesSelected().length === 0 &&
            this.workoutVM()?.exercises.length === 0 &&
            this.workoutVM()?.exercises.filter((ex) => ex.series === 0).length === 0
        )
            return false;
        if (this.workoutVM()?.exercises.find((ex) => ex.sets?.length === 0)) return false;
        return true;
    }

    constructor() {
        effect(() => {
            if (!this.workoutVM()) return;

            this.initFacade();
        });
    }

    exercises = signal<ExercisePerformanceVM[]>([]);
    exercisesSelected = this.state.exercises;
    exercisesTracking = signal<ExercisePerformanceVM[]>([]);
    loading = this.trackingSvc.loadingWorkout;

    validateForm(): boolean {
        return this.exerciseForm.valid;
    }

    initFacade() {
        this.exerciseForm.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((val) => {
                const allExercises = this.exerciseSvc.wrapperExerciseAPItoVM();
                if (!val.option) {
                    this.exercises.set([...this.exercisesSelected(), ...allExercises]);
                } else {
                    this.exercises.set([
                        ...this.exercisesSelected(),
                        ...allExercises.filter(
                            (e) =>
                                e.category === val.option && !this.exercisesSelected().includes(e),
                        ),
                    ]);
                }
            });
    }

    clear() {
        this.exerciseForm.patchValue({ option: '' });
    }
    startRoutineTracking() {
        this.trackingSvc.createWorkout(this.workoutDate()!).subscribe({
            next: (res) => {
                console.log(res);
                // this.
            },
            error: () => {},
        });
    }
}
