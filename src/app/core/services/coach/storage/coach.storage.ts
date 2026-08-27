import { Injectable } from '@angular/core';
import { TrainingPlanDetail } from '../../../../shared/interfaces/coach.interface';

@Injectable({
    providedIn: 'root',
})
export class CoachStorageService {
    private readonly storagePrefix = 'coach_generated_plan:';

    private getKey(userId?: string): string {
        return `${this.storagePrefix}${userId ?? 'default'}`;
    }

    getGeneratedPlan(userId?: string): TrainingPlanDetail | null {
        try {
            const data = localStorage.getItem(this.getKey(userId));
            return data ? (JSON.parse(data) as TrainingPlanDetail) : null;
        } catch {
            return null;
        }
    }

    setGeneratedPlan(plan: TrainingPlanDetail, userId?: string): void {
        try {
            localStorage.setItem(this.getKey(userId), JSON.stringify(plan));
        } catch (e) {
            console.warn('No se pudo guardar el plan en localStorage:', e);
        }
    }

    removeGeneratedPlan(userId?: string): void {
        try {
            localStorage.removeItem(this.getKey(userId));
        } catch (e) {
            console.warn('No se pudo eliminar el plan de localStorage:', e);
        }
    }
}
