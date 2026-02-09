import { Component, DestroyRef, inject, input, signal, SimpleChanges } from '@angular/core';
import { ExercisesService } from '../../../../../../core/services/exercises/exercises.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Exercise } from '../../../../../interfaces/exercise.interface';
import { ExerciseSelector } from '../../../exercises/exercise-selector/exercise-selector';
import { FormControl, FormGroup } from '@angular/forms';
import { SelectType } from '../routine-scheduler';
import { noEmpty } from '../../../../../validators/no-empty.validator';
import { options } from '../../../../../interfaces/input.interface';
import { FormSelectComponent } from '../../../../ui/select/select';
import { FormInputComponent } from '../../../../ui/input/input';
import {
    ExercisePerformance,
    ExercisePerformanceVM,
    WorkoutSessionVM,
} from '../../../../../interfaces/tracking.interface';
import { PlanTrackingService } from '../../../../../../core/services/trackings/plan-tracking.service';
import { map, switchMap, take } from 'rxjs';

@Component({
    selector: 'app-routine-tracking-exercise',
    imports: [ExerciseSelector, FormSelectComponent],
    standalone: true,
    templateUrl: './routine-tracking-exercise.html',
    styles: ``,
})
export class RoutineTrackingExercise {
    exerciseSvc = inject(ExercisesService);
    destroyRef = inject(DestroyRef);

    trackingSvc = inject(PlanTrackingService);

    workout = input<WorkoutSessionVM>();
    // selectControl = input<FormControl<string | null>>(new FormControl<string | null>(''));

    exercises = signal<Exercise[]>([]);
    exercisesSelected = signal<Exercise[]>([]);
    exercisesVM = signal<ExercisePerformanceVM[]>([]);
    loading = signal(true);

    exerciseForm = new FormGroup<SelectType>({
        option: new FormControl('', {
            validators: [noEmpty],
            nonNullable: true,
        }),
    });

    options = options;

    ngOnInit() {
        this.trackingSvc.trackingPlanVM$
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                take(1),
                map((tracking) => {
                    if (!tracking) return;
                    tracking.workouts
                        ?.filter((w) => w.date === this.workout()?.date)
                        .forEach((w) => {
                            this.exercisesVM.set(w.exercises);
                        });
                }),
                switchMap((e) => this.exerciseSvc.getExercises()),
            )
            .subscribe({
                next: (value) => {
                    // console.log(value, categoryExercise);
                    console.log(value);
                    const valueFiltered: Exercise[] = value.filter((v) =>
                        this.exercisesVM().some((ex) => ex.exerciseId === v.id),
                    );
                    console.log(valueFiltered);
                    this.exercises.set(value);
                    this.exercisesSelected.set(valueFiltered);
                    this.loading.set(false);
                },
                error: () => this.loading.set(false),
            });

        this.exerciseForm.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((val) => {
                const allExercises = this.exerciseSvc.exercises();
                this.exercises.set([
                    // ...this.exercisesSelected(),
                    ...allExercises.filter(
                        (e) => e.category === val.option && !this.exercisesSelected().includes(e),
                    ),
                ]);
            });
    }

    toggleExercise(ex: Exercise) {
        if (this.exercisesSelected().some((e) => e.id === ex.id)) {
            this.exercisesSelected.set(this.exercisesSelected().filter((e) => e.id !== ex.id));
        } else {
            this.exercisesSelected.set([...this.exercisesSelected(), ex]);
        }

        this.trackingSvc.trackingPlanVM$
            .pipe(takeUntilDestroyed(this.destroyRef), take(1))
            .subscribe((tracking) => {
                if (!tracking) return;

                const updatedWorkouts = tracking.workouts?.map((w) => {
                    if (w.date === this.workout()?.date) {
                        return { ...w, exercises: this.generateArrayOfExercises() };
                    }
                    return w;
                });

                this.trackingSvc.setTracking({ ...tracking, workouts: updatedWorkouts });
            });
    }

    generateArrayOfExercises(): ExercisePerformanceVM[] {
        return this.exercisesSelected().map((ex) => ({
            exerciseId: ex.id || '',
            series: 0,
        }));
    }

    get selectControl(): FormControl<string> {
        return this.exerciseForm.get('option') as FormControl<string>;
    }
}
