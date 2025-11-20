import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormInputComponent } from '../../../../shared/components/ui/input/input';
import { FormControlsOf } from '../../../../shared/utils/form-types.util';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Exercise, ExerciseCategory } from '../../../../shared/interfaces/exercise.interface';
import { CheckboxComponent } from '../../../../shared/components/ui/checkbox/checkbox';
import { FormSelectComponent } from '../../../../shared/components/ui/select/select';
import { options, SelectTypeInput } from '../../../../shared/interfaces/input.interface';
import { ExercisesService } from '../../../../core/services/exercises/exercises.service';
import { BtnComponent } from '../../../../shared/components/ui/btn/btn';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

type RoutinePlanType = FormControlsOf<Exercise>;
type selectFormType = FormControlsOf<SelectTypeInput>;

// { name: string; description: string; }>;

@Component({
    selector: 'app-exercise-create',
    imports: [FormInputComponent, CheckboxComponent, FormSelectComponent, BtnComponent],
    standalone: true,
    templateUrl: './exercise-create.html',
    styleUrl: './exercise-create.css',
})
export class ExerciseCreate implements OnInit {
    private destroyRef = inject(DestroyRef);

    selectForm!: FormGroup<selectFormType>;

    routineExerciseCreateForm!: FormGroup<RoutinePlanType>;

    options = options;

    constructor(private exerciseSvc: ExercisesService) {}
    ngOnInit(): void {
        this.routineExerciseCreateForm = this.initForm();
        this.selectForm = this.initFormSelect();

        this.selectControl.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((value) => {
                this.categoryControl.setValue(value as ExerciseCategory);
            });
    }

    initForm(): FormGroup<RoutinePlanType> {
        return new FormGroup<RoutinePlanType>({
            name: new FormControl('', {
                nonNullable: true,
                validators: [Validators.required, Validators.minLength(3)],
            }),
            description: new FormControl('', { nonNullable: true }),
            category: new FormControl(ExerciseCategory.BACK, {
                nonNullable: true,
                validators: [Validators.required],
            }),
            usesWeight: new FormControl(false, { nonNullable: true }),
        });
    }

    initFormSelect(): FormGroup<selectFormType> {
        return new FormGroup<selectFormType>({
            option: new FormControl('', { nonNullable: true }),
        });
    }

    onSubmit(): void {
        if (this.routineExerciseCreateForm.invalid) {
            this.routineExerciseCreateForm.markAllAsTouched();
            return;
        }

        const newExercise: Exercise = this.routineExerciseCreateForm.value as Exercise;

        this.exerciseSvc
            .createExercise(newExercise)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => console.log('Exercise created successfully:', response),
                error: (error) => console.error('Error creating exercise:', error),
            });
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
