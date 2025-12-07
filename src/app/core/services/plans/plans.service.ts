import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { BehaviorSubject, filter, map, switchMap, take, tap } from 'rxjs';
import {
    DayPlan,
    RoutineDay,
    RoutinePlan,
    RoutinePlanCreate,
} from '../../../shared/interfaces/routines.interface';
import { PlansStorageService } from './storage/plans-storage.service';
import { DayPlanService } from '../day-plan/day-plan.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable({
    providedIn: 'root',
})
export class PlansService {
    private destroyRef = inject(DestroyRef);

    private plansSubject = new BehaviorSubject<RoutinePlanCreate | null>(null);
    routinePlan$ = this.plansSubject.pipe(filter((v): v is RoutinePlanCreate => v !== null));
    userId = signal<string>('');

    constructor(
        private authSvc: AuthService,
        private planStorage: PlansStorageService,
        private dayPlan: DayPlanService,
    ) {}

    initPlanForUser(userId: string) {
        if (this.userId() !== '') {
            return;
        }
        const stored = this.planStorage.getPlanStorage(userId);

        this.userId.set(userId);

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

    setRoutinePlan(plan: RoutinePlanCreate) {
        this.plansSubject.next(plan);
        this.planStorage.setPlanStorage(plan, this.userId());
        if (this.plansSubject.value) this.dayPlan.changeDayPlan(plan);
    }
    setRoutineDay(routine: RoutineDay) {
        let arrPlans = this.plansSubject.value;

        this.dayPlan.dayPlan$
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                take(1),
                map((value: DayPlan[]) => {
                    const [day] = value.filter((e) => e.expanded === true);
                    const routineDays = arrPlans?.routineDays.map((f, index) =>
                        index + 1 === day.day ? routine : f,
                    );

                    if (routineDays && arrPlans) {
                        const updatePlan: RoutinePlanCreate = { ...arrPlans, routineDays };
                        if (updatePlan) this.setRoutinePlan(updatePlan);
                    }

                    return day;
                }),
            )
            .subscribe();
    }

    removeDayRoutine(dayToRemove: RoutineDay) {
        let arrPlans = this.plansSubject.value;

        this.dayPlan.dayPlan$
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                take(1),
                map((value: DayPlan[]) => {
                    const [day] = value.filter((e) => e.expanded === true);
                    const routineDays = arrPlans?.routineDays.map((f, index) =>
                        index + 1 === day.day ? ({} as RoutineDay) : f,
                    );

                    if (routineDays && arrPlans) {
                        const updatePlan: RoutinePlanCreate = { ...arrPlans, routineDays };
                        if (updatePlan) this.setRoutinePlan(updatePlan);
                    }

                    return day;
                }),
            )
            .subscribe();
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

    setDayRoutine(dayIndex: number, routine: RoutineDay) {
        const plan = this.currentValue();
        const routineDays = plan.routineDays.map((d, i) => (i === dayIndex ? routine : d));

        const updated = { ...plan, routineDays };
        this.setRoutinePlan(updated);
    }
}
