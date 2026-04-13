import { Component, inject, input, output, effect, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
    ExtraSessionFormType,
    ExtraSessionService,
} from '../../../../../core/services/extra-session/extra-session.service';
import { WorkoutStateService } from '../../../../../core/services/workouts/workout.state';
import { ExtraSessionDisciplineConfig } from '../../../../../shared/interfaces/extra-session.interface';
import { BtnComponent } from '../../../ui/btn/btn';
import { RatingBar } from '../../../ui/rating-bar/rating-bar';
import { InputNumber } from '../../../ui/input-number/input-number';
import { merge, Subscription } from 'rxjs';

@Component({
    selector: 'app-extra-session-create',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, BtnComponent, RatingBar, InputNumber],
    templateUrl: './extra-session-create.html',
})
export class ExtraSessionCreate implements OnInit, OnDestroy {
    config = input.required<ExtraSessionDisciplineConfig>();
    onCancel = output<void>();
    onSave = output<void>();

    private service = inject(ExtraSessionService);
    private subscription?: Subscription;

    form: FormGroup<ExtraSessionFormType> = this.service.extraSessionForm;

    ngOnInit() {
        this.subscription = merge(
            this.durationControl.valueChanges,
            this.intensityLevelControl.valueChanges,
        ).subscribe(() => {
            this.updateCalories();
        });

        this.updateCalories();
    }

    ngOnDestroy() {
        this.subscription?.unsubscribe();
    }

    private updateCalories() {
        const config = this.config();
        if (!config || config.met === undefined) return;

        const calories = this.calculateCalories(
            config.met,
            70,
            this.durationControl.value,
            this.intensityLevelControl.value,
        );

        this.caloriesControl.setValue(calories, { emitEvent: false });
    }

    onSaveClick() {
        this.onSave.emit();
    }

    calculateCalories(
        met: number,
        weightKg: number,
        durationMinutes: number,
        intensityLevel: number,
    ): number {
        const hours = durationMinutes / 60;
        const intensityFactor = this.getIntensityFactor(intensityLevel);
        const adjustedMet = met * intensityFactor;
        return Math.round(adjustedMet * weightKg * hours);
    }

    getIntensityFactor(level: number): number {
        const base = 3;
        const step = 0.15;
        return 1 + (level - base) * step;
    }

    get durationControl(): FormControl<number> {
        return this.form.get('duration') as FormControl<number>;
    }

    get intensityLevelControl(): FormControl<number> {
        return this.form.get('intensityLevel') as FormControl<number>;
    }

    get caloriesControl(): FormControl<number> {
        return this.form.get('calories') as FormControl<number>;
    }

    cancel() {
        this.onCancel.emit();
    }
}
