import { Component, OnInit } from '@angular/core';
import { RoutineExerciseForm } from '../../shared/components/widgets/routines/routine-exercise-form/routine-exercise-form';
import { options, SelectTypeInput } from '../../shared/interfaces/input.interface';
import { FormControlsOf } from '../../shared/utils/form-types.util';
import { FormControl, FormGroup } from '@angular/forms';
import { FormSelectComponent } from '../../shared/components/ui/select/select';

type ExerciseType = FormControlsOf<SelectTypeInput>;

@Component({
    selector: 'app-exercises',
    imports: [RoutineExerciseForm, FormSelectComponent],
    standalone: true,
    templateUrl: './exercises.html',
    styleUrl: './exercises.css',
})
export class Exercises implements OnInit {
    exerciseForm!: FormGroup<ExerciseType>;

    options = options;

    ngOnInit(): void {
        this.exerciseForm = this.initForm();
    }

    initForm(): FormGroup<ExerciseType> {
        return new FormGroup<ExerciseType>({
            option: new FormControl('', { nonNullable: true }),
        });
    }

    get selectControl(): FormControl<string> {
        return this.exerciseForm.get('option') as FormControl<string>;
    }
}
