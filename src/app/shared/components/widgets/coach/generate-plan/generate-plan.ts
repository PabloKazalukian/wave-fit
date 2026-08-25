import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CoachService } from '../../../../../core/services/coach/coach.service';
import { BtnComponent } from '../../../ui/btn/btn';
import { IconComponent } from '../../../ui/icon/icon';
import { SpinnerComponent } from '../../../ui/icon/spinner';
import { TrainingPlanDetail } from '../../../../interfaces/coach.interface';
import { CoachManageWithPlan } from '../coach-manage-with-plan/coach-manage-with-plan';

@Component({
    selector: 'app-coach-generate-plan',
    imports: [FormsModule, BtnComponent, IconComponent, SpinnerComponent, CoachManageWithPlan],
    templateUrl: './generate-plan.html',
    styles: ``,
})
export class CoachGeneratePlan {
    private coachService = inject(CoachService);

    comment = '';
    loading = signal(false);
    errorMessage = signal<string | null>(null);
    planResult = signal<TrainingPlanDetail | null>(null);

    onSubmit(): void {
        if (this.loading()) return;

        this.loading.set(true);
        this.errorMessage.set(null);
        this.planResult.set(null);

        this.coachService.generatePlan(this.comment).subscribe({
            next: (data) => {
                this.loading.set(false);
                if (data?.aiSnapshot?.rawResponse) {
                    this.planResult.set(data);
                } else {
                    this.errorMessage.set('La IA no devolvió un plan válido. Intentá de nuevo.');
                }
            },
            error: (err) => {
                this.loading.set(false);
                const msg = Array.isArray(err)
                    ? err
                          .map((e: { message?: string }) => e.message || '')
                          .filter(Boolean)
                          .join(', ')
                    : err?.message || 'Error al generar el plan';
                this.errorMessage.set(msg);
            },
        });
    }

    onClearPlanResult(): void {
        this.planResult.set(null);
    }
}
