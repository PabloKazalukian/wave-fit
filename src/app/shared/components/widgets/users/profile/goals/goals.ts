import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormControlsOf } from '../../../../../utils/form-types.util';
import { FormInputComponent } from '../../../../ui/input/input';
import { InputNumber } from '../../../../ui/input-number/input-number';
import { FormSelectComponent } from '../../../../ui/select/select';
import { SelectType } from '../../../../../interfaces/input.interface';
import { BtnComponent } from '../../../../ui/btn/btn';

export interface GoalForm {
    primaryGoal: string;
    secondaryGoals: string[];
    targetWeightKg: number;
    timelineWeeks: number;
    trainingExperience: string;
    sportSpecificity: string;
    isActive: boolean;
}

type GoalFormType = FormControlsOf<GoalForm>;

@Component({
    selector: 'app-goals',
    standalone: true,
    imports: [ReactiveFormsModule, FormInputComponent, InputNumber, BtnComponent, FormSelectComponent],
    templateUrl: './goals.html',
})
export class Goals implements OnInit {
    goalForm!: FormGroup<GoalFormType>;

    primaryGoalOptions: SelectType[] = [
        { name: 'Pérdida de grasa', value: 'fat_loss' },
        { name: 'Ganancia muscular', value: 'muscle_gain' },
        { name: 'Fuerza', value: 'strength' },
        { name: 'Resistencia', value: 'endurance' },
        { name: 'Mantenimiento', value: 'maintenance' },
        { name: 'Recomposición corporal', value: 'recomp' },
    ];

    trainingExperienceOptions: SelectType[] = [
        { name: 'Principiante', value: 'beginner' },
        { name: 'Intermedio', value: 'intermediate' },
        { name: 'Avanzado', value: 'advanced' },
        { name: 'Atleta', value: 'athlete' },
    ];

    ngOnInit() {
        this.goalForm = this.initForm();
    }

    initForm(): FormGroup<GoalFormType> {
        return new FormGroup<GoalFormType>({
            primaryGoal: new FormControl('', {
                nonNullable: true,
                validators: [Validators.required],
            }),
            secondaryGoals: new FormControl([], { nonNullable: true }),
            targetWeightKg: new FormControl(0, { nonNullable: true }),
            timelineWeeks: new FormControl(0, { nonNullable: true }),
            trainingExperience: new FormControl('', { nonNullable: true }),
            sportSpecificity: new FormControl('', { nonNullable: true }),
            isActive: new FormControl(true, { nonNullable: true }),
        });
    }

    onSubmit() {
        if (this.goalForm.invalid) return;
        console.log(this.goalForm.getRawValue());
    }

    get primaryGoalControl() {
        return this.goalForm.get('primaryGoal')! as FormControl<string>;
    }

    get secondaryGoalsControl() {
        return this.goalForm.get('secondaryGoals')! as FormControl<string[]>;
    }

    get targetWeightKgControl() {
        return this.goalForm.get('targetWeightKg')! as FormControl<number>;
    }

    get timelineWeeksControl() {
        return this.goalForm.get('timelineWeeks')! as FormControl<number>;
    }

    get trainingExperienceControl() {
        return this.goalForm.get('trainingExperience')! as FormControl<string>;
    }

    get sportSpecificityControl() {
        return this.goalForm.get('sportSpecificity')! as FormControl<string>;
    }

    get isActiveControl() {
        return this.goalForm.get('isActive')! as FormControl<boolean>;
    }
}
