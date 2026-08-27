import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { TrainingPlanDetail } from '../../../shared/interfaces/coach.interface';
import { CoachStorageService } from './storage/coach.storage';
import { AuthService } from '../auth/auth.service';

@Injectable({
    providedIn: 'root',
})
export class CoachState {
    private readonly storage = inject(CoachStorageService);
    private readonly authService = inject(AuthService);

    readonly activePlan = signal<TrainingPlanDetail | null>(null);
    readonly loading = signal<boolean>(false);

    readonly hasActivePlan = computed(() => this.activePlan() !== null);

    constructor() {
        // Al cargar o cambiar el usuario, intentar recuperar el plan guardado en cache
        effect(() => {
            const user = this.authService.user();
            if (user?.id) {
                this.loadCachedPlan(user.id);
            }
        });
    }

    loadCachedPlan(userId?: string): void {
        const uid = userId ?? this.authService.user()?.id;
        const cached = this.storage.getGeneratedPlan(uid);
        if (cached) {
            this.activePlan.set(cached);
        }
    }

    setPlan(plan: TrainingPlanDetail, persist: boolean = true): void {
        this.activePlan.set(plan);
        if (persist) {
            const uid = this.authService.user()?.id;
            this.storage.setGeneratedPlan(plan, uid);
        }
    }

    clearPlan(): void {
        this.activePlan.set(null);
        const uid = this.authService.user()?.id;
        this.storage.removeGeneratedPlan(uid);
    }
}
