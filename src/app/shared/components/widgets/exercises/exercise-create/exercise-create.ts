import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormInputComponent } from '../../../ui/input/input';
import { CheckboxComponent } from '../../../ui/checkbox/checkbox';
import { FormSelectComponent } from '../../../ui/select/select';
import { BtnComponent } from '../../../ui/btn/btn';
import { FormControlsOf } from '../../../../utils/form-types.util';
import { SelectTypeInput } from '../../../../interfaces/input.interface';
import { Exercise, ExerciseCategory } from '../../../../interfaces/exercise.interface';
import { ExercisesService } from '../../../../../core/services/exercises/exercises.service';
import { options } from '../../../../../shared/interfaces/input.interface';
import { Loading } from '../../../ui/loading/loading';
import { Notification } from '../../../ui/notification/notification';
import { ExerciseCreateFacade, RoutinePlanType, selectFormType } from './exercise-create.facade';

// { name: string; description: string; }>;

@Component({
    selector: 'app-exercise-create',
    imports: [
        FormInputComponent,
        CheckboxComponent,
        FormSelectComponent,
        BtnComponent,
        Loading,
        Notification,
    ],
    standalone: true,
    templateUrl: './exercise-create.html',
})
export class ExerciseCreate implements OnInit {
    private destroyRef = inject(DestroyRef);
    private facade = inject(ExerciseCreateFacade);

    selectForm: FormGroup = this.facade.selectForm;
    routineExerciseCreateForm: FormGroup<RoutinePlanType> = this.facade.routineExerciseCreateForm;

    options = options;

    loading = signal<boolean>(true);
    complete = signal<boolean | null>(null);
    showNotification = signal<boolean>(false);

    constructor(private exerciseSvc: ExercisesService) {}
    ngOnInit(): void {
        setTimeout(() => {
            this.loading.set(false);
            this.complete.set(true);
        }, 1000);
        this.selectControl.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((value) => {
                this.categoryControl.setValue(value as ExerciseCategory);
            });
    }

    onSubmit(): void {
        this.loading.set(true);
        if (this.routineExerciseCreateForm.invalid && this.selectForm) {
            this.routineExerciseCreateForm.markAllAsTouched();
            console.log('fail');
            setTimeout(() => {
                this.loading.set(false);
            }, 1000);
            return;
        }

        const newExercise: Exercise = this.routineExerciseCreateForm.value as Exercise;

        this.exerciseSvc
            .createExercise(newExercise)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    console.log('Exercise created successfully:', response);
                    // this.loading.set(false);
                    this.complete.set(true);
                },
                error: (error) => {
                    this.complete.set(false);

                    console.error('Error creating exercise:', error);
                },
                complete: () => {
                    this.loading.set(false);
                },
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
