import { Component, inject, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormInputComponent } from '../../../ui/input/input';
import { CheckboxComponent } from '../../../ui/checkbox/checkbox';
import { BtnComponent } from '../../../ui/btn/btn';
import { ExerciseCategory } from '../../../../interfaces/exercise.interface';
import { Loading } from '../../../ui/loading/loading';
import { Notification } from '../../../ui/notification/notification';
import { ExerciseCreateFacade } from './exercise-create.facade';
import { ExerciseCategoryPipe } from '../../../../pipes/exercise-category.pipe';

@Component({
    selector: 'app-exercise-create',
    imports: [
        FormInputComponent,
        CheckboxComponent,
        BtnComponent,
        Loading,
        Notification,
        ExerciseCategoryPipe,
        ReactiveFormsModule,
    ],
    standalone: true,
    templateUrl: './exercise-create.html',
    providers: [ExerciseCreateFacade],
})
export class ExerciseCreate implements OnInit {
    facade = inject(ExerciseCreateFacade);

    @Input() set selectedCategory(val: string) {
        if (val) {
            this.facade.selectForm.patchValue({ option: val });
        } else {
            this.facade.selectForm.patchValue({ option: '' });
        }
    }

    @Output() onCancel = new EventEmitter<void>();
    @Output() onCreateSuccess = new EventEmitter<void>();

    cancel() {
        this.facade.routineExerciseCreateForm.reset();
        this.facade.selectForm.reset();
        this.onCancel.emit();
    }

    ngOnInit(): void {
        this.facade.initFacade();
    }

    onSubmit() {
        this.facade.submit()?.subscribe({
            next: (response) => {
                console.log('Exercise created successfully:', response);
                this.facade.complete.set(false);
                this.facade.showNotification.set(true);
                this.facade.notification.set('success');
                this.onCreateSuccess.emit();
            },
            error: (error) => {
                this.facade.complete.set(false);
                this.facade.showNotification.set(true);
                this.facade.notification.set('error');

                console.error('Error creating exercise:', error);
            },
            complete: () => {
                this.facade.loading.set(false);
                // this.facade.showNotification.set();
                this.facade.notification.set('');
            },
        });
    }

    get nameControl(): FormControl<string> {
        return this.facade.routineExerciseCreateForm.get('name') as FormControl<string>;
    }

    get descriptionControl(): FormControl<string> {
        return this.facade.routineExerciseCreateForm.get('description') as FormControl<string>;
    }

    get categoryControl(): FormControl<ExerciseCategory> {
        return this.facade.routineExerciseCreateForm.get(
            'category',
        ) as FormControl<ExerciseCategory>;
    }

    get usesWeightControl(): FormControl<boolean> {
        return this.facade.routineExerciseCreateForm.get('usesWeight') as FormControl<boolean>;
    }
    get selectControl(): FormControl<string> {
        return this.facade.selectForm.get('option') as FormControl<string>;
    }
}
