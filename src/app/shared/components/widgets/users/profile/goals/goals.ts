import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControlsOf } from '../../../../../utils/form-types.util';
import { FormInputComponent } from '../../../../ui/input/input';
import { InputNumber } from '../../../../ui/input-number/input-number';
import { FormSelectComponent } from '../../../../ui/select/select';
import { SelectType } from '../../../../../interfaces/input.interface';
import { BtnComponent } from '../../../../ui/btn/btn';
import { UserProfileService } from '../../../../../../core/services/user/user-profile.service';
import { PrimaryGoal, UpdateGoalsInput } from '../../../../../utils/profile.types';

type GoalFormType = FormControlsOf<UpdateGoalsInput>;

@Component({
    selector: 'app-goals',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        FormInputComponent,
        InputNumber,
        BtnComponent,
        FormSelectComponent,
    ],
    templateUrl: './goals.html',
})
export class Goals implements OnInit {
    private destroyRef = inject(DestroyRef);
    private userProfileService = inject(UserProfileService);

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

        this.userProfileService.userProfile$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((profile) => {
                if (!profile?.goal) return;
                this.goalForm.patchValue({
                    primaryGoal: profile.goal.primaryGoal,
                    secondaryGoals: profile.goal.secondaryGoals || [],
                    targetWeightKg: profile.goal.targetWeightKg || undefined,
                    timelineWeeks: profile.goal.timelineWeeks || undefined,
                    trainingExperience: profile.goal.trainingExperience,
                    sportSpecificity: profile.goal.sportSpecificity || undefined,
                });
            });
    }

    initForm(): FormGroup<GoalFormType> {
        return new FormGroup<GoalFormType>({
            primaryGoal: new FormControl('fat_loss' as PrimaryGoal, {
                nonNullable: true,
                validators: [Validators.required],
            }),
            secondaryGoals: new FormControl([], { nonNullable: true }),
            targetWeightKg: new FormControl(undefined as unknown as number, { nonNullable: true }),
            timelineWeeks: new FormControl(undefined as unknown as number, { nonNullable: true }),
            trainingExperience: new FormControl('beginner', { nonNullable: true }),
            sportSpecificity: new FormControl(undefined as unknown as string, {
                nonNullable: true,
            }),
        });
    }

    onSubmit() {
        if (this.goalForm.invalid) return;
        this.userProfileService
            .updateGoals(this.goalForm.getRawValue())
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe();
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
}
