import { DestroyRef, effect, inject, Injectable, signal } from '@angular/core';
import { ExercisesService } from '../../../../../core/services/exercises/exercises.service';
import { Exercise } from '../../../../interfaces/exercise.interface';
import {
    ExercisePerformanceVM,
    StatusWorkoutSessionEnum,
    WorkoutSessionVM,
} from '../../../../interfaces/tracking.interface';
import { PlanTrackingService } from '../../../../../core/services/trackings/plan-tracking.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, switchMap, tap } from 'rxjs';
import { FormControl, FormGroup } from '@angular/forms';
import { SelectType } from '../tracking-week/tracking-week';

@Injectable()
export class TrackingWorkoutFacade {
    destroyRef = inject(DestroyRef);
    exerciseSvc = inject(ExercisesService);
    trackingSvc = inject(PlanTrackingService);

    exerciseForm = new FormGroup<SelectType>({
        option: new FormControl('', {
            nonNullable: true,
        }),
    });

    workoutDate = signal<Date | null>(null);
    workoutVM = signal<WorkoutSessionVM | null>(null);

    constructor() {
        effect(() =>
            this.trackingSvc
                .getWorkout(this.workoutDate()!)
                .subscribe((workout) => this.workoutVM.set(workout!)),
        );
    }

    exercises = signal<ExercisePerformanceVM[]>([]);
    exercisesSelected = signal<ExercisePerformanceVM[]>([]);
    exercisesTracking = signal<ExercisePerformanceVM[]>([]);
    loading = signal(true);

    initFacade(workoutDate: Date) {
        this.workoutDate.set(workoutDate);
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
    startRoutineTracking() {
        this.trackingSvc.setWorkouts(this.workoutDate()!, {
            ...this.workoutVM()!,
            status: StatusWorkoutSessionEnum.NOT_STARTED,
        });
    }
}
