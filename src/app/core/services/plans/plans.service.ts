import { Injectable } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { BehaviorSubject, filter } from 'rxjs';
import { RoutinePlan, RoutinePlanCreate } from '../../../shared/interfaces/routines.interface';
import { PlansStorageService } from './plans-storage.service';

@Injectable({
    providedIn: 'root',
})
export class PlansService {
    private plansSubject = new BehaviorSubject<RoutinePlanCreate | null>(null);
    routinePlan$ = this.plansSubject.pipe(filter((v): v is RoutinePlanCreate => v !== null));

    constructor(
        private authSvc: AuthService,
        private planStorage: PlansStorageService,
    ) {}

    initPlanForUser(userId: string) {
        const stored = this.planStorage.getPlanStorage(userId);

        if (stored) {
            this.plansSubject.next(stored);
        } else {
            const init = {
                id: '',
                name: '',
                description: '',
                weekly_distribution: '',
                routineDays: new Array(7).fill({}),
                createdBy: userId,
            };

            this.plansSubject.next(init);
            this.planStorage.setPlanStorage(init, userId);
        }
    }

    setRoutinePlan(plan: RoutinePlanCreate, idUser: string) {
        this.plansSubject.next(plan);
        this.planStorage.setPlanStorage(plan, idUser);
    }

    getRoutinePlan(id: string): RoutinePlanCreate | null {
        const data = this.planStorage.getPlanStorage(id);
        if (data) this.plansSubject.next(data);
        return this.plansSubject.getValue();
    }

    createRoutinePlan(planInput: RoutinePlanCreate) {
        const createdBy = this.authSvc.user();
        const newPlan: RoutinePlanCreate = {
            ...planInput,
            createdBy,
        };
        this.plansSubject.next(newPlan);
        return newPlan;
    }

    currentValue(): RoutinePlanCreate {
        const value = this.plansSubject.getValue();
        if (!value) throw new Error('RoutinePlan not initialized');
        return value;
    }
}
