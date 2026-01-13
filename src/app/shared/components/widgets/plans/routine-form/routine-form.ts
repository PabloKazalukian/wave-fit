import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormSelectComponent } from '../../../ui/select/select';
import { FormInputComponent } from '../../../ui/input/input';
import { FormControl } from '@angular/forms';
import { SelectType } from '../../../../interfaces/input.interface';
import { RoutineDay } from '../../../../interfaces/routines.interface';
import { WeeklyRoutinePlannerComponent } from '../weekly-routine-planner/weekly-routine-planner';
import { RoutinePlanFormFacade } from './routine-form.facade';

// type RoutinePlanType = FormControlsOf<RoutinePlanCreate>;

@Component({
    selector: 'app-routine-plan-form',
    standalone: true,
    templateUrl: './routine-form.html',
    imports: [
        FormSelectComponent,
        FormSelectComponent,
        FormInputComponent,
        WeeklyRoutinePlannerComponent,
    ],
    providers: [RoutinePlanFormFacade],
})
export class RoutinePlanForm implements OnInit {
    facade = inject(RoutinePlanFormFacade);

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

    onSubmit(event: any): void {
        this.facade.show.set(true);
        console.log(event);
        this.facade.submitPlan().subscribe((res) => {
            console.log(res);
        });
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
    get routinesDayControl(): FormControl<RoutineDay[]> {
        return this.facade.routineForm.get('routineDays') as FormControl<RoutineDay[]>;
    }
}
