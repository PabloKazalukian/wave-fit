import { DestroyRef, effect, inject, Injectable, signal } from '@angular/core';
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

    exerciseForm = new FormGroup<SelectType>({
        option: new FormControl('', {
            nonNullable: true,
        }),
    });

    readonly workoutDate = this.state.selectedDate;
    readonly workoutVM = this.state.workoutSession;

    validateWorkout(): boolean {
        if (this.exercisesSelected().length === 0) return false;
        if (this.workoutVM()?.exercises.find((ex) => ex.sets.length === 0)) return false;
        return true;
    }

    constructor() {
        effect(() => {
            // const workout = this.state.workoutSession();
            if (!this.workoutVM()) return;

            this.initFacade(this.workoutVM()?.date!);
        });
    }

    exercises = signal<ExercisePerformanceVM[]>([]);
    exercisesSelected = signal<ExercisePerformanceVM[]>([]);
    exercisesTracking = signal<ExercisePerformanceVM[]>([]);
    loading = signal(true);

    validateForm(): boolean {
        return this.exerciseForm.valid;
    }

    initFacade(workoutDate: Date) {
        this.trackingSvc
            .getExercises(workoutDate)
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                tap((exercises) => this.exercisesTracking.set(exercises)),
                switchMap(() => this.exerciseSvc.getExercises()), //Asegura que haga la peticion.
                map(() => this.exerciseSvc.wrapperExerciseAPItoVM()),
            )
            .subscribe({
                next: (allExercises) => {
                    const exercisesFiltered: ExercisePerformanceVM[] = allExercises.filter((v) =>
                        this.exercisesTracking().some((ex) => ex.exerciseId === v.exerciseId),
                    );

                    this.exercises.set(allExercises);
                    this.exercisesSelected.set(exercisesFiltered);
                    this.loading.set(false);
                },
                error: () => this.loading.set(false),
            });

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

    toggleExercise(ex: ExercisePerformanceVM) {
        if (this.exercisesSelected().some((e) => e.exerciseId === ex.exerciseId)) {
            this.exercisesSelected.set(
                this.exercisesSelected().filter((e) => e.exerciseId !== ex.exerciseId),
            );
        } else {
            this.exercisesSelected.set([...this.exercisesSelected(), ex]);
        }

        this.trackingSvc.setExercises(this.workoutDate()!, this.exercisesSelected());
    }

    clear() {
        this.exerciseForm.patchValue({ option: '' });
    }

    removeExercise(exerciseId: string) {
        this.toggleExercise(this.exercisesSelected().find((ex) => ex.exerciseId === exerciseId)!);
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
