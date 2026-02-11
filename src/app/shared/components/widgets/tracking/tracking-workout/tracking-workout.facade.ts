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
import { noEmpty } from '../../../../validators/no-empty.validator';
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

    exercises = signal<Exercise[]>([]);
    exercisesSelected = signal<Exercise[]>([]);
    exercisesVM = signal<ExercisePerformanceVM[]>([]);
    loading = signal(true);

    initFacade(workoutDate: Date) {
        this.workoutDate.set(workoutDate);
        this.trackingSvc
            .getExercises(workoutDate)
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                tap((exercises) => this.exercisesVM.set(exercises)),
                switchMap((e) => this.exerciseSvc.getExercises()),
            )
            .subscribe({
                next: (allExercises) => {
                    const exercisesFiltered: Exercise[] = allExercises.filter((v) =>
                        this.exercisesVM().some((ex) => ex.exerciseId === v.id),
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
                const allExercises = this.exerciseSvc.exercises();
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

    toggleExercise(ex: Exercise) {
        if (this.exercisesSelected().some((e) => e.id === ex.id)) {
            this.exercisesSelected.set(this.exercisesSelected().filter((e) => e.id !== ex.id));
        } else {
            this.exercisesSelected.set([...this.exercisesSelected(), ex]);
        }

        this.trackingSvc.setExercises(this.workoutDate()!, this.generateArrayOfExercises());
    }

    clear() {
        this.exerciseForm.patchValue({ option: '' });
    }
    startRoutineTracking() {
        this.trackingSvc.setWorkouts(this.workoutDate()!, {
            ...this.workoutVM()!,
            status: StatusWorkoutSessionEnum.IN_PROGRESS,
        });

        // .subscribe((workout) => {});
        // StatusWorkoutSessionEnum
    }

    private generateArrayOfExercises(): ExercisePerformanceVM[] {
        return this.exercisesSelected().map((ex) => ({
            exerciseId: ex.id || '',
            name: ex.name || '',
            series: 0,
        }));
    }
}
