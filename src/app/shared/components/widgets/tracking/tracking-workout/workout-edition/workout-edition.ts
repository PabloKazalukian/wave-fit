import { Component, inject, OnInit } from '@angular/core';
import { TrackingWorkoutFacade } from '../tracking-workout.facade';
import { CommonModule } from '@angular/common';
import { BtnComponent } from '../../../../ui/btn/btn';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
    selector: 'app-workout-edition',
    imports: [CommonModule, BtnComponent, ReactiveFormsModule],
    standalone: true,
    templateUrl: './workout-edition.html',
    styles: ``,
})
export class WorkoutEdition implements OnInit {
    facade = inject(TrackingWorkoutFacade);
    workoutForm!: FormGroup;

    ngOnInit(): void {
        this.initForm();
    }

    initForm() {
        const exercises = this.facade.exercisesSelected();
        const exerciseGroups = exercises.map((ex) => {
            return new FormGroup({
                exerciseId: new FormControl(ex.exerciseId),
                name: new FormControl(ex.name),
                sets: new FormArray(
                    ex.sets.map((set) => {
                        return new FormGroup({
                            reps: new FormControl(set.reps),
                            weights: new FormControl(set.weights),
                        });
                    }),
                ),
            });
        });

        this.workoutForm = new FormGroup({
            exercises: new FormArray(exerciseGroups),
        });
    }

    get exerciseFormArray(): FormArray {
        return this.workoutForm.get('exercises') as FormArray;
    }

    getSetsFormArray(index: number): FormArray {
        return this.exerciseFormArray.at(index).get('sets') as FormArray;
    }

    onSave() {
        const formValue = this.workoutForm.value;
        const currentWorkout = this.facade.workoutVM();
        if (!currentWorkout) return;

        const updatedExercises = currentWorkout.exercises.map((ex) => {
            const formExercise = formValue.exercises.find((fe: any) => fe.exerciseId === ex.exerciseId);
            if (formExercise) {
                return {
                    ...ex,
                    sets: formExercise.sets.map((s: any) => ({
                        reps: Number(s.reps),
                        weights: Number(s.weights),
                    })),
                };
            }
            return ex;
        });

        const updatedWorkout = {
            ...currentWorkout,
            exercises: updatedExercises,
            status: 'complete' as any, // Explicitly return to complete
        };

        this.facade.updateWorkoutSession(updatedWorkout);
    }
}
