import { Component, input, output, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ExtraSessionService } from '../../../../../../core/services/extra-session/extra-session.service';
import {
    ExtraSession,
    ExtraSessionDisciplineConfig,
} from '../../../../../interfaces/extra-session.interface';
import { merge, Subscription } from 'rxjs';
import { BtnComponent } from '../../../../ui/btn/btn';
import { RatingBar } from '../../../../ui/rating-bar/rating-bar';
import { InputNumber } from '../../../../ui/input-number/input-number';

@Component({
    selector: 'app-extra-session-card',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, BtnComponent, RatingBar, InputNumber],
    templateUrl: './extra-session-card.html',
})
export class ExtraSessionCard implements OnInit, OnDestroy {
    service = inject(ExtraSessionService);
    session = input.required<ExtraSession>();
    disciplines = input<ExtraSessionDisciplineConfig[]>([]);

    readonly extraSessions = this.service.extraSessions;

    onDelete = output<string>();
    onSave = output<{ id: string; duration: number; intensityLevel: number; calories?: number }>();
    onCancelEdit = output<void>();

    isEditing = signal(false);
    private subscription?: Subscription;

    form = new FormGroup({
        duration: new FormControl<number>(0, { nonNullable: true }),
        intensityLevel: new FormControl<number>(0, { nonNullable: true }),
        calories: new FormControl<number>(0, { nonNullable: true }),
    });

    ngOnInit() {
        this.subscription = merge(
            this.durationControl.valueChanges,
            this.intensityControl.valueChanges,
        ).subscribe(() => {
            this.updateCalories();
        });
    }

    ngOnDestroy() {
        this.subscription?.unsubscribe();
    }

    startEdit(): void {
        this.isEditing.set(true);
        this.form.patchValue({
            duration: this.session().duration,
            intensityLevel: this.session().intensityLevel,
            calories: this.session().calories || 0,
        });
    }

    cancelEdit(): void {
        this.isEditing.set(false);
        this.onCancelEdit.emit();
    }

    saveChanges(): void {
        if (this.form.invalid) return;

        this.onSave.emit({
            id: this.session().id,
            duration: this.durationControl.value,
            intensityLevel: this.intensityControl.value,
            calories: this.caloriesControl.value || undefined,
        });
        this.isEditing.set(false);
    }

    deleteSession(): void {
        this.onDelete.emit(this.session().id);
    }

    private updateCalories(): void {
        const config = this.disciplines().find((d) => d.key === this.session().discipline);
        if (!config || config.met === undefined) return;

        const hours = this.durationControl.value / 60;
        const intensityFactor = 1 + (this.intensityControl.value - 3) * 0.15;
        const adjustedMet = config.met * intensityFactor;
        const calories = Math.round(adjustedMet * 70 * hours);

        this.caloriesControl.setValue(calories, { emitEvent: false });
    }

    getDisciplineLabel(): string {
        const config = this.disciplines().find((d) => d.key === this.session().discipline);
        return config?.label || this.session().discipline;
    }

    get durationControl(): FormControl<number> {
        return this.form.get('duration') as FormControl<number>;
    }

    get intensityControl(): FormControl<number> {
        return this.form.get('intensityLevel') as FormControl<number>;
    }

    get caloriesControl(): FormControl<number> {
        return this.form.get('calories') as FormControl<number>;
    }
}
