import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormSelectComponent } from '../../shared/components/ui/select/select';
import { FormControl, FormGroup } from '@angular/forms';
import { FormControlsOf } from '../../shared/utils/form-types.util';
import { BtnComponent } from '../../shared/components/ui/btn/btn';
import { UserService } from '../../core/services/user/user.service';
import { RoutinesServices } from '../../core/services/routines/routines.service';
import { SelectType, SelectTypeInput } from '../../shared/interfaces/input.interface';
import { ExercisesService } from '../../core/services/exercises/exercises.service';
import { Exercise } from '../../shared/interfaces/exercise.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RoutineDay } from '../../shared/interfaces/routines.interface';
import { RoutinePlanAPI } from '../../shared/interfaces/api/routines-api.interface';
import { RouterModule } from '@angular/router';
import { ExercisesTableComponent } from '../../shared/components/widgets/exercises/table/exercises-table';

type selectFormType = FormControlsOf<SelectTypeInput>;

@Component({
    selector: 'app-routines',
    imports: [FormSelectComponent, BtnComponent, RouterModule, ExercisesTableComponent],
    standalone: true,
    templateUrl: './routines.html',
})
export class Routines implements OnInit {
    private destroyRef = inject(DestroyRef);

    options: SelectType[] = [
        { name: '1/7', value: '1' },
        { name: '2/7', value: '2' },
        { name: '3/7', value: '3' },
        { name: '4/7', value: '4' },
        { name: '5/7', value: '5' },
        { name: '6/7', value: '6' },
        { name: '7/7', value: '7' },
    ];

    routinesPlans = signal<RoutinePlanAPI[]>([]);
    // exercises: Exercise[] = []
    exercises = signal<Exercise[]>([]);

    selectForm!: FormGroup<selectFormType>;
    showSelected: string = '';

    constructor(
        private svcUser: UserService,
        private svcRoutines: RoutinesServices,
    ) {}

    ngOnInit(): void {
        this.selectForm = this.initForm();

        this.svcRoutines
            .getRoutinesPlans()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((result) => {
                console.log(result);
                this.routinesPlans.set(result);
                console.log(this.routinesPlans());
            });

        this.selectControl.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((newValue: string) => {
                this.showSelected = newValue;
            });
    }

    initForm(): FormGroup<selectFormType> {
        return new FormGroup<selectFormType>({
            option: new FormControl('', { nonNullable: true }),
        });
    }

    createRoutine() {
        this.svcUser
            .getAllUsers()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((result) => {});
    }

    get selectControl(): FormControl<string> {
        return this.selectForm.get('option') as FormControl<string>;
    }
}
