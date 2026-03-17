import { Component, inject, OnInit } from '@angular/core';
import { FormSelectComponent } from '../../../ui/select/select';
import { FormInputComponent } from '../../../ui/input/input';
import { FormControl } from '@angular/forms';
import { SelectType } from '../../../../interfaces/input.interface';
import { RoutineDayVM, RoutinePlan } from '../../../../interfaces/routines.interface';
import { WeeklyRoutinePlannerComponent } from '../weekly-routine-planner/weekly-routine-planner';
import { RoutinePlanFormFacade } from './routine-form.facade';
import { SuccessScreen } from '../../../ui/success-screen/success-screen';
import { Router } from '@angular/router';
import { timer } from 'rxjs';
import { BtnComponent } from '../../../ui/btn/btn';
import { DialogComponent } from '../../../ui/dialog/dialog';
import { Notification } from '../../../ui/notification/notification';
import { IconComponent } from '../../../ui/icon/icon';
import { SpinnerComponent } from '../../../ui/icon/spinner';

// type RoutinePlanType = FormControlsOf<RoutinePlanCreate>;

@Component({
    selector: 'app-routine-plan-form',
    standalone: true,
    templateUrl: './routine-form.html',
    imports: [
        FormSelectComponent,
        FormInputComponent,
        WeeklyRoutinePlannerComponent,
        SuccessScreen,
        BtnComponent,
        DialogComponent,
        Notification,
        IconComponent,
        SpinnerComponent,
    ],
    providers: [RoutinePlanFormFacade],
})
export class RoutinePlanForm implements OnInit {
    facade = inject(RoutinePlanFormFacade);
    router = inject(Router);

    options: SelectType[] = [
        { name: '1/7', value: '1' },
        { name: '2/7', value: '2' },
        { name: '3/7', value: '3' },
        { name: '4/7', value: '4' },
        { name: '5/7', value: '5' },
        { name: '6/7', value: '6' },
        { name: '7/7', value: '7' },
    ];

    ngOnInit(): void {
        this.facade.initFacade();
    }

    onSubmit(): void {
        this.facade.routineForm.markAllAsTouched();
        if (this.facade.routineForm.valid) {
            this.facade.showConfirmSave.set(true);
        } else {
            this.facade.notification.set({
                show: true,
                type: 'error',
                message: 'Por favor, completa los campos requeridos correctamente.',
            });
        }
    }

    confirmSave(): void {
        this.facade.showConfirmSave.set(false);
        this.facade.show.set(true);
        this.facade.submitPlan().subscribe({
            next: (res: RoutinePlan) => {
                this.facade.complete.set(true);
                timer(3000).subscribe(() => {
                    this.facade.show.set(false);
                    this.router.navigate(['/routines/show/' + res?.id]);
                });
            },
            error: (err) => console.error(err),
        });
    }

    onCancelRequested(): void {
        this.facade.showConfirmCancel.set(true);
    }

    confirmCancel(): void {
        this.facade.showConfirmCancel.set(false);
        this.facade.removeForm();
        this.router.navigate(['/routines']);
    }

    onRestart(): void {
        this.facade.show.set(false);
    }

    get nameControl(): FormControl<string> {
        return this.facade.routineForm.get('name') as FormControl<string>;
    }

    get selectControl(): FormControl<string> {
        return this.facade.routineForm.get('weekly_distribution') as FormControl<string>;
    }

    get descriptionControl(): FormControl<string> {
        return this.facade.routineForm.get('description') as FormControl<string>;
    }
    get routinesDayControl(): FormControl<RoutineDayVM[]> {
        return this.facade.routineForm.get('routineDays') as FormControl<RoutineDayVM[]>;
    }
}
