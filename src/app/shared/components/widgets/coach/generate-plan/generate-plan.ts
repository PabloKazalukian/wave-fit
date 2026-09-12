import { Component, inject, signal, OnInit, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CoachService } from '../../../../../core/services/coach/coach.service';
import { CoachState } from '../../../../../core/services/coach/coach.state';
import { BtnComponent } from '../../../ui/btn/btn';
import { IconComponent } from '../../../ui/icon/icon';
import { SpinnerComponent } from '../../../ui/icon/spinner';
import { AiUsageStatus, TrainingPlanDetail } from '../../../../interfaces/coach.interface';

@Component({
    selector: 'app-coach-generate-plan',
    imports: [FormsModule, BtnComponent, IconComponent, SpinnerComponent],
    templateUrl: './generate-plan.html',
    styles: ``,
})
export class CoachGeneratePlan implements OnInit {
    private coachService = inject(CoachService);
    private coachState = inject(CoachState);

    planGenerated = output<TrainingPlanDetail>();

    comment = '';
    loading = signal(false);
    errorMessage = signal<string | null>(null);

    usageStatus = signal<AiUsageStatus | null>(null);
    usageLoading = signal(false);

    ngOnInit(): void {
        this.loadUsageStatus();
    }

    loadUsageStatus(): void {
        this.usageLoading.set(true);
        this.coachService.getAiUsageStatus().subscribe({
            next: (status) => {
                this.usageStatus.set(status);
                this.usageLoading.set(false);
            },
            error: () => {
                this.usageLoading.set(false);
            },
        });
    }

    get hasReachedLimit(): boolean {
        const status = this.usageStatus();
        if (!status) return false;
        return status.remaining <= 0;
    }

    get resetAtFormatted(): string {
        const status = this.usageStatus();
        if (!status) return '';
        const date = new Date(status.resetAt);
        return date.toLocaleString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'UTC',
        });
    }

    onSubmit(): void {
        if (this.loading() || this.hasReachedLimit) return;

        this.loading.set(true);
        this.errorMessage.set(null);

        this.coachService.generatePlan(this.comment).subscribe({
            next: (data) => {
                this.loading.set(false);
                console.log(data);
                if (data?.aiSnapshot?.rawResponse) {
                    this.coachState.setPlan(data);
                    this.planGenerated.emit(data);
                    this.comment = '';
                    this.loadUsageStatus();
                } else {
                    this.errorMessage.set('La IA no devolvió un plan válido. Intentá de nuevo.');
                }
            },
            error: (err) => {
                this.loading.set(false);
                this.errorMessage.set(this.extractErrorMessage(err, 'Error al generar el plan'));
                this.loadUsageStatus();
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
