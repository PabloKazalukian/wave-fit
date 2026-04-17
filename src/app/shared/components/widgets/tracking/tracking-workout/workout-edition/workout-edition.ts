import { Component, inject, OnInit, effect, signal } from '@angular/core';
import { TrackingWorkoutFacade } from '../tracking-workout.facade';
import { CommonModule } from '@angular/common';
import { BtnComponent } from '../../../../ui/btn/btn';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { IconComponent } from '../../../../ui/icon/icon';
import { DialogComponent } from '../../../../ui/dialog/dialog';
import { ExerciseSelector } from '../../../exercises/exercise-selector/exercise-selector';
import {
    ExercisePerformanceVM,
    WorkoutSessionVM,
} from '../../../../../interfaces/tracking.interface';

interface SetsFormVM {
    reps: number;
    weights?: number;
}
@Component({
    selector: 'app-workout-edition',
    imports: [
        CommonModule,
        BtnComponent,
        ReactiveFormsModule,
        IconComponent,
        DialogComponent,
        ExerciseSelector,
    ],
    standalone: true,
    templateUrl: './workout-edition.html',
    styles: ``,
})
export class WorkoutEdition implements OnInit {
    facade = inject(TrackingWorkoutFacade);
    workoutForm!: FormGroup;
    isDialogOpen = signal<boolean>(false);

    constructor() {
        effect(() => {
            const exercises = this.facade.exercisesSelected();
            if (this.workoutForm) {
                const currentExerciseIds = exercises.map((e) => e.exerciseId);
                const formArray = this.exerciseFormArray;

                // Remove exercises that were unselected
                for (let i = formArray.length - 1; i >= 0; i--) {
                    const id = formArray.at(i).get('exerciseId')?.value;
                    if (!currentExerciseIds.includes(id)) {
                        formArray.removeAt(i);
                    }
                }

                // Add new selected exercises
                const formExIds: string[] = formArray.value.map(
                    (fe: ExercisePerformanceVM) => fe.exerciseId,
                );
                exercises.forEach((ex) => {
                    if (!formExIds.includes(ex.exerciseId)) {
                        this.addExerciseToForm(ex);
                    }
                });
            }
        });
    }

    ngOnInit(): void {
        this.initForm();
    }

    initForm() {
        const exercises = this.facade.exercisesSelected();
        const exerciseGroups = exercises.map((ex) => this.createExerciseFormGroup(ex));

        this.workoutForm = new FormGroup({
            exercises: new FormArray(exerciseGroups),
        });
    }

    createExerciseFormGroup(ex: ExercisePerformanceVM): FormGroup {
        return new FormGroup({
            exerciseId: new FormControl(ex.exerciseId),
            name: new FormControl(ex.name),
            usesWeight: new FormControl(ex.usesWeight),
            sets: new FormArray(
                ex.sets.map((set) => {
                    return new FormGroup({
                        reps: new FormControl(set.reps),
                        weights: new FormControl(set.weights),
                    });
                }),
            ),
        });
    }

    addExerciseToForm(ex: ExercisePerformanceVM): void {
        this.exerciseFormArray.push(this.createExerciseFormGroup(ex));
    }
    get exerciseFormArray(): FormArray {
        return this.workoutForm.get('exercises') as FormArray;
    }

    getSetsFormArray(index: number): FormArray {
        return this.exerciseFormArray.at(index).get('sets') as FormArray;
    }

    addSet(exerciseIndex: number): void {
        const setsArray = this.getSetsFormArray(exerciseIndex);
        const lastSet = setsArray.at(setsArray.length - 1)?.value;
        setsArray.push(
            new FormGroup({
                reps: new FormControl(lastSet?.reps || 0),
                weights: new FormControl(lastSet?.weights || 0),
            }),
        );
    }

    removeSet(exerciseIndex: number, setIndex: number): void {
        const setsArray = this.getSetsFormArray(exerciseIndex);
        if (setsArray.length > 0) {
            setsArray.removeAt(setIndex);
        }
    }

    removeExercise(index: number): void {
        const id = this.exerciseFormArray.at(index).get('exerciseId')?.value;
        const currentExercises = this.facade.exercisesSelected();
        const updated = currentExercises.filter((e) => e.exerciseId !== id);
        this.facade.state.updateExercises(updated);
    }

    openDialog(): void {
        this.isDialogOpen.set(true);
    }

    closeDialog(): void {
        this.isDialogOpen.set(false);
    }

    onSave(): void {
        const formValue = this.workoutForm.value;
        const currentWorkout = this.facade.workoutVM();
        if (!currentWorkout) return;

        // Use the forms value directly but merge from the source facade items
        // Since we allow adding new exercises from the selector, we MUST use formValue.exercises as the base.
        const updatedExercises: ExercisePerformanceVM[] = formValue.exercises.map(
            (fe: ExercisePerformanceVM) => {
                const existingEx: ExercisePerformanceVM | undefined = currentWorkout.exercises.find(
                    (ex: ExercisePerformanceVM) => ex.exerciseId === fe.exerciseId,
                );
                const sourceEx: ExercisePerformanceVM | undefined = this.facade
                    .exercisesSelected()
                    .find((ex) => ex.exerciseId === fe.exerciseId);

                const mappedSets: { reps: number; weights: number }[] = fe.sets.map(
                    (s: SetsFormVM) => ({
                        reps: Number(s.reps),
                        weights: Number(s.weights),
                    }),
                );

                return {
                    ...(existingEx || sourceEx), // Keep original properties like category, muscle, etc.
                    sets: mappedSets,
                    series: mappedSets.length, // Always sync series with actual sets count
                };
            },
        );

        const updatedWorkout: WorkoutSessionVM = {
            ...currentWorkout,
            exercises: updatedExercises,
            status: 'complete', // Explicitly return to complete
        };

        this.facade.updateWorkoutSession(updatedWorkout);
    }
}
