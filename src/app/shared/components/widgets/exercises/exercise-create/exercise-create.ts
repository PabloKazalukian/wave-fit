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

import { trigger, transition, style, animate } from '@angular/animations';

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
    animations: [
        trigger('contentAnimation', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateY(10px)' }),
                animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
            ]),
            transition(':leave', [
                animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' })),
            ]),
        ]),
    ],
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
        this.facade.errorMessage.set(null);
        this.facade.loading.set(true);

        const result = this.facade.submit();

        if (!result) {
            // Validation failed
            setTimeout(() => {
                this.facade.loading.set(false);
            }, 500);
            return;
        }

        result.subscribe({
            next: (response) => {
                console.log(response);
                this.facade.loading.set(false);
                this.facade.complete.set(false);
                this.facade.showNotification.set(true);
                this.facade.notification.set('success');
                setTimeout(() => {
                    // this.onCancel.emit();
                    this.onCreateSuccess.emit();
                }, 2000);
            },
            error: (error) => {
                this.facade.loading.set(false);
                // Si hay un error, lo mostramos debajo del input, no usamos notificación
                const message = error.message || 'Error al crear el ejercicio';
                this.facade.errorMessage.set(message);

                console.error('Error creating exercise:', error);
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
