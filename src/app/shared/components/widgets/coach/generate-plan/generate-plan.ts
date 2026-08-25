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
    deleting = signal(false);
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
                this.errorMessage.set(this.extractErrorMessage(err, 'Error al generar el plan'));
            },
        });
    }

    onClearPlanResult(): void {
        const plan = this.planResult();
        if (!plan || this.deleting()) return;

        this.deleting.set(true);
        this.errorMessage.set(null);

        // El "Borrar" elimina en el backend el plan recién generado y solo
        // entonces se limpia la vista; si falla, el plan queda visible.
        this.coachService.removePlantraningById(plan.id).subscribe({
            next: () => {
                this.deleting.set(false);
                this.planResult.set(null);
            },
            error: (err) => {
                this.deleting.set(false);
                this.errorMessage.set(this.extractErrorMessage(err, 'Error al borrar el plan'));
            },
        });
    }

    private extractErrorMessage(err: unknown, fallback: string): string {
        if (Array.isArray(err)) {
            return (
                err
                    .map((e: { message?: string }) => e.message || '')
                    .filter(Boolean)
                    .join(', ') || fallback
            );
        }
        return (err as { message?: string })?.message || fallback;
    }
}
