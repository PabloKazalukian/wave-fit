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

type selectFormType = FormControlsOf<SelectTypeInput>;

@Component({
    selector: 'app-routines',
    imports: [FormSelectComponent, BtnComponent],
    standalone: true,
    templateUrl: './routines.html',
    styleUrl: './routines.css',
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

    routinesPlans: any[] = [];
    // exercises: Exercise[] = []
    exercises = signal<Exercise[]>([]);

    selectForm!: FormGroup<selectFormType>;
    showSelected: string = '';

    constructor(
        private svcUser: UserService,
        private svcRoutines: RoutinesServices,
        private exerciseSvc: ExercisesService
    ) {}

    ngOnInit(): void {
        this.selectForm = this.initForm();
        this.exerciseSvc
            .getExercises()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data) => {
                    console.log('lista de ejercicios:', data);
                    if (data!) this.exercises.set(data);
                },
                error: (err) => {},
            });

        this.svcRoutines
            .getRoutinesPlans()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((result) => {
                console.log('Rutinas:', result.data);
                this.routinesPlans = result.data.routinePlans;
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
            .subscribe((result) => {
                console.log('Usuarios:', result.data);
            });
    }

    get selectControl(): FormControl<string> {
        return this.selectForm.get('option') as FormControl<string>;
    }
}
