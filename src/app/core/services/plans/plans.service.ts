import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { BehaviorSubject, filter, map, Observable, switchMap, take, tap } from 'rxjs';
import {
    DayPlan,
    RoutineDay,
    RoutineDayCreate,
    RoutinePlanCreate,
} from '../../../shared/interfaces/routines.interface';
import { PlansStorageService } from './storage/plans-storage.service';
import { DayPlanService } from '../day-plan/day-plan.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PlansApiService } from './api/plans-api.service';
import { ExerciseCategory } from '../../../shared/interfaces/exercise.interface';

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
            this.dayPlanSvc.initDayPlan(this.userId(), stored);
            // syncFromPlan
        } else {
            const init = {
                name: '',
                description: '',
                weekly_distribution: '',
                routineDays: new Array(7).fill({
                    title: '',
                    kind: 'REST',
                }),
                createdBy: userId,
                id: null,
            };

            this.plansSubject.next(init);
            this.planStorage.setPlanStorage(init, userId);
            this.dayPlanSvc.initDayPlan(this.userId());
        }
    }

    setRoutinePlan(plan: RoutinePlanCreate) {
        this.plansSubject.next(plan);
        this.planStorage.setPlanStorage(plan, this.userId());
        if (this.plansSubject.value) this.dayPlanSvc.changeDayPlan(plan);
    }

    setKindRoutineDay(dayIndex: number, kind: 'REST' | 'WORKOUT') {
        this.routinePlan$.pipe(take(1)).subscribe((plan) => {
            const routineDays = plan.routineDays.map((d, i) =>
                i === dayIndex ? { ...d, kind: kind } : d,
            );
            const updatePlan: RoutinePlanCreate = { ...plan, routineDays };
            this.setRoutinePlan(updatePlan);
        });
    }

    setRoutineDayType(type: string, indexDay: number) {
        // let newRoutine = this.plansSubject.value?.routineDays.map((d, i) =>
        //     i === indexDay ? { ...d, workoutType: type } : d,
        // );
        // if (newRoutine && this.plansSubject.value) {
        //     const updatePlan: RoutinePlanCreate = {
        //         ...this.plansSubject.value,
        //         routineDays: newRoutine,
        //     };
        //     console.log('updatePlan', updatePlan);
        //     this.setRoutinePlan(updatePlan);
        // }
        this.routinePlan$.pipe(takeUntilDestroyed(this.destroyRef), take(1)).subscribe((plan) => {
            const routineDays = plan.routineDays.map((d, i) =>
                i === indexDay ? { ...d, type: [type] } : d,
            );
            const updatePlan: RoutinePlanCreate = { ...plan, routineDays };
            this.setRoutinePlan(updatePlan);
        });
    }

    setRoutineDay(routine: RoutineDay) {
        this.dayPlanSvc.dayPlan$
            .pipe(
                take(1),
                map((dayPlans: DayPlan[]) => {
                    const expandedDay = dayPlans.find((d) => d.expanded === true);

                    if (!expandedDay) {
                        console.error('No expanded day found');
                        return null;
                    }

                    const currentPlan = this.plansSubject.value;
                    if (!currentPlan) return null;

                    // Actualizar routineDays
                    const routineDays = currentPlan.routineDays.map((r, index) => {
                        if (index + 1 === expandedDay.day) {
                            return routine;
                        }
                        return r;
                    });

                    const updatePlan: RoutinePlanCreate = {
                        ...currentPlan,
                        routineDays,
                    };

                    this.setRoutinePlan(updatePlan);

                    // IMPORTANTE: Actualizar también el DayPlan
                    const updatedDayPlans = dayPlans.map((d) => {
                        if (d.day === expandedDay.day) {
                            return {
                                ...d,
                                routineId: routine.id,
                                workoutType: routine.type?.[0] || d.workoutType,
                            };
                        }
                        return d;
                    });

                    this.dayPlanSvc.setPlanDay(updatedDayPlans);

                    return expandedDay;
                }),
            )
            .subscribe();
    }

    removeDayRoutine(dayToRemove: RoutineDay) {
        this.dayPlanSvc.dayPlan$
            .pipe(
                take(1),
                map((dayPlans: DayPlan[]) => {
                    const expandedDay = dayPlans.find((d) => d.expanded === true);

                    if (!expandedDay) return null;

                    const currentPlan = this.plansSubject.value;
                    if (!currentPlan) return null;

                    // ARREGLADO: Crear un routineDay vacío pero válido
                    const emptyRoutine: RoutineDayCreate = {
                        title: '',
                        kind: 'WORKOUT',
                        type: expandedDay.workoutType
                            ? [expandedDay.workoutType as ExerciseCategory]
                            : undefined,
                    };

                    const routineDays = currentPlan.routineDays.map((r, index) => {
                        if (index + 1 === expandedDay.day) {
                            return emptyRoutine;
                        }
                        return r;
                    });

                    const updatePlan: RoutinePlanCreate = {
                        ...currentPlan,
                        routineDays,
                    };

                    this.setRoutinePlan(updatePlan);

                    // IMPORTANTE: Actualizar también el DayPlan
                    const updatedDayPlans = dayPlans.map((d) => {
                        if (d.day === expandedDay.day) {
                            return {
                                ...d,
                                routineId: undefined,
                                // Mantener el workoutType para poder cargar categorías
                            };
                        }
                        return d;
                    });

                    this.dayPlanSvc.setPlanDay(updatedDayPlans);

                    return expandedDay;
                }),
            )
            .subscribe();
    }

    getRoutinePlan(idUser: string): RoutinePlanCreate | null {
        const data = this.planStorage.getPlanStorage(idUser);
        if (data) this.plansSubject.next(data);
        return this.plansSubject.getValue();
    }
    getRoutinePlanById(id: string): Observable<any | null> {
        return this.planApi.getRoutinePlanById(id);
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

    submitPlan(): Observable<any> {
        return this.planApi.createPlan(this.currentValue());
    }
}
