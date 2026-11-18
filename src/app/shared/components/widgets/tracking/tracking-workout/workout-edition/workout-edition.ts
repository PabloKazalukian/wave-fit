import {
    Component,
    Input,
    Output,
    OnInit,
    OnChanges,
    SimpleChanges,
    EventEmitter,
    signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormArray, FormControl } from '@angular/forms';
import {
    ExercisePerformanceVM,
    WorkoutSessionVM,
} from '../../../../../interfaces/tracking.interface';
import { BtnComponent } from '../../../../ui/btn/btn';

interface SetsFormVM {
    reps: number;
    weights?: number;
}

@Component({
    selector: 'app-workout-edition',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, BtnComponent],
    templateUrl: './workout-edition.html',
})
export class WorkoutEdition implements OnInit, OnChanges {
    @Input() workoutSession!: WorkoutSessionVM;
    @Input() exercises: ExercisePerformanceVM[] = [];
    @Output() saveWorkoutSession = new EventEmitter<WorkoutSessionVM>();
    @Output() closeEdition = new EventEmitter<void>();
    @Output() exercisesChange = new EventEmitter<ExercisePerformanceVM[]>();

    workoutForm!: FormGroup;
    isDialogOpen = signal<boolean>(false);

    constructor() {
        console.log(this.workoutSession);
    }

    ngOnInit(): void {
        this.initForm();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['exercises'] && this.workoutForm) {
            this.initForm();
        }
    }

    initForm() {
        const exerciseGroups = this.exercises.map((ex) => this.createExerciseFormGroup(ex));

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
        const updated = this.exercises.filter((e) => e.exerciseId !== id);
        this.exercisesChange.emit(updated);
        this.initForm();
    }

    openDialog(): void {
        this.isDialogOpen.set(true);
    }

    closeDialog(): void {
        this.isDialogOpen.set(false);
        this.closeEdition.emit();
    }

    onSave(): void {
        const formValue = this.workoutForm.value;
        const currentWorkout = this.workoutSession;

        if (!currentWorkout) return;

        const updatedExercises: ExercisePerformanceVM[] = formValue.exercises.map(
            (fe: ExercisePerformanceVM) => {
                const existingEx: ExercisePerformanceVM | undefined = currentWorkout.exercises.find(
                    (ex: ExercisePerformanceVM) => ex.exerciseId === fe.exerciseId,
                );

                const mappedSets: { reps: number; weights: number }[] = fe.sets.map(
                    (s: SetsFormVM) => ({
                        reps: Number(s.reps),
                        weights: Number(s.weights),
                    }),
                );

                // Always include form values (exerciseId, name, usesWeight) then override with existing for extra props
                return {
                    exerciseId: fe.exerciseId,
                    name: fe.name,
                    usesWeight: fe.usesWeight,
                    ...existingEx, // Override with existing: category, muscle, etc.
                    sets: mappedSets,
                    series: mappedSets.length,
                };
            },
        );

        const updatedWorkout: WorkoutSessionVM = {
            ...currentWorkout,
            exercises: updatedExercises,
            status: 'complete',
        };

        this.saveWorkoutSession.emit(updatedWorkout);
    }
}
