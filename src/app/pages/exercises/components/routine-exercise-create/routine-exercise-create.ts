import { Component, OnInit } from '@angular/core';
import { FormInputComponent } from '../../../../shared/components/ui/input/input';
import { FormControlsOf } from '../../../../shared/utils/form-types.util';
import { FormControl, FormGroup } from '@angular/forms';
import { Exercise, ExerciseCategory } from '../../../../shared/interfaces/exercise.interface';
import { CheckboxComponent } from '../../../../shared/components/ui/checkbox/checkbox';
import { FormSelectComponent } from '../../../../shared/components/ui/select/select';
import { options, SelectTypeInput } from '../../../../shared/interfaces/input.interface';
import { ExercisesService } from '../../../../core/services/exercises/exercises.service';

type RoutinePlanType = FormControlsOf<Exercise>;
type selectFormType = FormControlsOf<SelectTypeInput>;

// { name: string; description: string; }>;

@Component({
    selector: 'app-routine-exercise-create',
    imports: [FormInputComponent, CheckboxComponent, FormSelectComponent],
    standalone: true,
    templateUrl: './routine-exercise-create.html',
    styleUrl: './routine-exercise-create.css',
})
export class RoutineExerciseCreate implements OnInit {
    selectForm!: FormGroup<selectFormType>;

    routineExerciseCreateForm!: FormGroup<RoutinePlanType>;

    options = options;

    constructor(private exerciseSvc: ExercisesService) {}
    ngOnInit(): void {
        this.routineExerciseCreateForm = this.initForm();
        this.selectForm = this.initFormSelect();
    }

    initForm(): FormGroup<RoutinePlanType> {
        return new FormGroup<RoutinePlanType>({
            name: new FormControl('', { nonNullable: true }),
            description: new FormControl('', { nonNullable: true }),
            category: new FormControl(ExerciseCategory.BACK, { nonNullable: true }),
            usesWeight: new FormControl(false, { nonNullable: true }),
        });
    }

    initFormSelect(): FormGroup<selectFormType> {
        return new FormGroup<selectFormType>({
            option: new FormControl('BACK', { nonNullable: true }),
        });
    }

    onSubmit(): void {
        if (this.routineExerciseCreateForm.valid) {
            const newExercise: Partial<Exercise> = this.routineExerciseCreateForm.value;
            console.log('New Exercise:', newExercise);
            this.exerciseSvc.createExercise(newExercise).subscribe({
                next: (response) => {
                    console.log('Exercise created successfully:', response);
                },
                error: (error) => {
                    console.error('Error creating exercise:', error);
                },
            });
        }
    }

    get nameControl(): FormControl<string> {
        return this.routineExerciseCreateForm.get('name') as FormControl<string>;
    }

    get descriptionControl(): FormControl<string> {
        return this.routineExerciseCreateForm.get('description') as FormControl<string>;
    }

    get categoryControl(): FormControl<ExerciseCategory> {
        return this.routineExerciseCreateForm.get('category') as FormControl<ExerciseCategory>;
    }

    get usesWeightControl(): FormControl<boolean> {
        return this.routineExerciseCreateForm.get('usesWeight') as FormControl<boolean>;
    }
    get selectControl(): FormControl<string> {
        return this.selectForm.get('option') as FormControl<string>;
    }
}
