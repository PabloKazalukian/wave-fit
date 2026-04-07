import { Component, inject, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ExtraSessionService } from '../../../../../core/services/extra-session/extra-session.service';
import { WorkoutStateService } from '../../../../../core/services/workouts/workout.state';
import { ExtraSessionDisciplineConfig } from '../../../../../shared/interfaces/extra-session.interface';
import { FormInputComponent } from '../../../ui/input/input';
import { BtnComponent } from '../../../ui/btn/btn';

@Component({
  selector: 'app-extra-session-card',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormInputComponent, BtnComponent],
  templateUrl: './extra-session-card.html',
})
export class ExtraSessionCard {
  config = input.required<ExtraSessionDisciplineConfig>();
  onCancel = output<void>();

  private service = inject(ExtraSessionService);
  private workoutState = inject(WorkoutStateService);
  private fb = inject(FormBuilder);

  form = this.fb.group({
    duration: [30, [Validators.required, Validators.min(1)]],
    intensityLevel: [3, [Validators.required, Validators.min(1), Validators.max(5)]],
    calories: [0, [Validators.required, Validators.min(0)]],
  });

  constructor() {
    effect(() => {
      // Whenever config changes, calculate base calories
      const currentConfig = this.config();
      if (currentConfig) {
        const duration = this.form.get('duration')?.value || 0;
        const calculated = Math.round((currentConfig.avgCaloriesPerHour / 60) * duration);
        this.form.patchValue({ calories: calculated });
      }
    });

    // Also update calories when duration changes manually if they haven't explicitly overriden calories
    // We'll just recalculate whenever duration changes
    this.form.get('duration')?.valueChanges.subscribe(duration => {
      const currentConfig = this.config();
      if (currentConfig && duration) {
        const calculated = Math.round((currentConfig.avgCaloriesPerHour / 60) * duration);
        this.form.patchValue({ calories: calculated }, { emitEvent: false });
      }
    });
  }

  submit() {
    this.form.markAllAsTouched();
    if (this.form.valid) {
      const workoutSession = this.workoutState.workoutSession();
      if (!workoutSession || !workoutSession.id) {
        console.error('No active workout session found to attach extra session to.');
        return;
      }

      this.service.create({
        workoutSessionId: workoutSession.id,
        date: new Date().toISOString(),
        discipline: this.config().key,
        duration: this.form.value.duration!,
        intensityLevel: this.form.value.intensityLevel!,
        calories: this.form.value.calories || undefined,
        notes: '',
      }).subscribe({
        next: () => {
          this.form.reset({ duration: 30, intensityLevel: 3, calories: 0 });
          this.onCancel.emit();
        },
        error: (err) => console.error(err)
      });
    }
  }

  cancel() {
    this.onCancel.emit();
  }
}
