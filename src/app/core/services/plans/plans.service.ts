import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { BehaviorSubject, filter, map, Observable, of, switchMap, take, tap } from 'rxjs';
import {
    DayIndex,
    DayPlan,
    KindEnum,
    RoutineDay,
    RoutineDayVM,
    RoutinePlanCreate,
    RoutinePlanVM,
} from '../../../shared/interfaces/routines.interface';
import { PlansStorageService } from './storage/plans-storage.service';
import { DayPlanService } from '../day-plan/day-plan.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PlansApiService } from './api/plans-api.service';
import { ExerciseCategory } from '../../../shared/interfaces/exercise.interface';
import { RoutinesServices } from '../routines/routines.service';
import { Kind } from 'graphql';

@Injectable({
    providedIn: 'root',
})
export class PlansService {
    private destroyRef = inject(DestroyRef);

    private plansSubject = new BehaviorSubject<RoutinePlanVM | null>(null);
    routinePlanVM$ = this.plansSubject.pipe(filter((v): v is RoutinePlanVM => v !== null));
    userId = signal<string>('');

    constructor(
        private authSvc: AuthService,
        private planStorage: PlansStorageService,
        private dayPlanSvc: DayPlanService,
        private planApi: PlansApiService,
    ) {}

    initPlanForUser(userId: string) {
        if (this.userId() !== '') {
            return;
        }
        const stored = this.planStorage.getPlanStorage(userId);

        this.userId.set(userId);

        if (stored) {
            this.plansSubject.next(stored);
            // this.dayPlanSvc.initDayPlan(this.userId(), stored);
            // syncFromPlan
        } else {
            const initPlanUser: RoutinePlanVM = {
                name: '',
                description: '',
                weekly_distribution: '',
                routineDays: this.initRoutineDays(),
                createdBy: userId,
                id: undefined,
            };

            this.plansSubject.next(initPlanUser);
            this.planStorage.setPlanStorage(initPlanUser, userId);
            this.dayPlanSvc.initDayPlan(this.userId());
        }
    }

    initRoutineDays(): RoutineDayVM[] {
        return Array.from({ length: 7 }, (_, i) => ({
            title: '',
            kind: 'REST',
            expanded: i === 0,
            day: (i + 1) as DayIndex,
        }));
    }

    setRoutinePlan(plan: RoutinePlanVM) {
        console.log(plan.routineDays);
        this.plansSubject.next(plan);
        this.planStorage.setPlanStorage(plan, this.userId());
    }

    setKindRoutineDay(dayIndex: number, kind: 'REST' | 'WORKOUT') {
        this.routinePlanVM$.pipe(take(1)).subscribe((plan) => {
            const routineDays = plan.routineDays.map((d, i) =>
                i === dayIndex ? { ...d, kind: kind } : d,
            );
            const updatePlan: RoutinePlanVM = { ...plan, routineDays };
            this.setRoutinePlan(updatePlan);
        });
    }

    removeDayRoutine(dayToRemove: DayIndex) {
        this.routinePlanVM$.pipe(take(1)).subscribe((plan) => {
            const routineDays = plan.routineDays.map((d) =>
                d.day === dayToRemove ? { ...d, id: undefined } : d,
            );
            const updatePlan: RoutinePlanVM = { ...plan, routineDays };
            this.setRoutinePlan(updatePlan);
        });
    }

    getRoutinePlan(idUser: string): RoutinePlanVM | null {
        const data = this.planStorage.getPlanStorage(idUser);
        // if (data) this.plansSubject.next(data);
        return this.plansSubject.getValue();
    }
    getRoutinePlanById(id: string): Observable<any | null> {
        return this.planApi.getRoutinePlanById(id);
    }

    createRoutinePlan(planInput: RoutinePlanVM): RoutinePlanVM {
        const createdBy = this.authSvc.user();
        const newPlan: RoutinePlanVM = {
            ...planInput,
            createdBy,
        };
        this.plansSubject.next(newPlan);
        return newPlan;
    }

    currentValue(): RoutinePlanVM {
        const value = this.plansSubject.getValue();
        if (!value) throw new Error('RoutinePlan not initialized');
        return value;
    }

    setDayRoutine(dayIndex: number, routine: RoutineDayVM) {
        const plan = this.currentValue();
        const routineDays = plan.routineDays.map((d, i) => (i === dayIndex ? routine : d));

        const updated = { ...plan, routineDays };
        console.log(updated);
        this.setRoutinePlan(updated);
    }

    setDayRoutines(routineDays: RoutineDayVM[]) {
        this.setRoutinePlan({ ...this.currentValue(), routineDays });
    }

    submitPlan(current: any): Observable<any> {
        return of(current);
        return this.planApi.createPlan(current);
    }

    validateTitleUnique(title: string): Observable<boolean | undefined> {
        return this.planApi.validateTitleUnique(title);
    }
}
