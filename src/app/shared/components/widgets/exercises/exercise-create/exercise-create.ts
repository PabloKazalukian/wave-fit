import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { FormInputComponent } from '../../../ui/input/input';
import { CheckboxComponent } from '../../../ui/checkbox/checkbox';
import { FormSelectComponent } from '../../../ui/select/select';
import { BtnComponent } from '../../../ui/btn/btn';
import { ExerciseCategory } from '../../../../interfaces/exercise.interface';
import { Loading } from '../../../ui/loading/loading';
import { Notification } from '../../../ui/notification/notification';
import { ExerciseCreateFacade } from './exercise-create.facade';

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
    providers: [ExerciseCreateFacade],
})
export class ExerciseCreate implements OnInit {
    facade = inject(ExerciseCreateFacade);

    ngOnInit(): void {
        this.facade.initFacade();
    }

    onSubmit() {
        this.facade.submit()?.subscribe({
            next: (response) => {
                console.log('Exercise created successfully:', response);
                // this.loading.set(false);
                this.facade.complete.set(false);
                this.facade.showNotification.set(true);
                this.facade.notification.set('success');
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
