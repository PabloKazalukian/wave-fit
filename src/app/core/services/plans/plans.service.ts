import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { BehaviorSubject, filter, map, Observable, switchMap, take, tap } from 'rxjs';
import {
    DayIndex,
    DayPlan,
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
        console.log(plan);
        this.plansSubject.next(plan);
        this.planStorage.setPlanStorage(plan, this.userId());
        // if (this.plansSubject.value) this.dayPlanSvc.changeDayPlan(plan);
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
        // this.routinePlanVM$.pipe(takeUntilDestroyed(this.destroyRef), take(1)).subscribe((plan) => {
        //     const routineDays = plan.routineDays.map((d, i) =>
        //         i === indexDay ? { ...d, type: [type] } : d,
        //     );
        //     const updatePlan: RoutinePlanCreate = { ...plan, routineDays };
        //     this.setRoutinePlan(updatePlan);
        // });
    }

    // setRoutineDay(routine: RoutineDay) {
    //     this.dayPlanSvc.dayPlan$
    //         .pipe(
    //             take(1),
    //             map((dayPlans: DayPlan[]) => {
    //                 const expandedDay = dayPlans.find((d) => d.expanded === true);

    //                 if (!expandedDay) {
    //                     console.error('No expanded day found');
    //                     return null;
    //                 }

    //                 const currentPlan = this.plansSubject.value;
    //                 if (!currentPlan) return null;

    //                 // Actualizar routineDays
    //                 const routineDays = currentPlan.routineDays.map((r, index) => {
    //                     if (index + 1 === expandedDay.day) {
    //                         return routine;
    //                     }
    //                     return r;
    //                 });

    //                 const updatePlan: RoutinePlanCreate = {
    //                     ...currentPlan,
    //                     routineDays,
    //                 };

    //                 this.setRoutinePlan(updatePlan);

    //                 // IMPORTANTE: Actualizar también el DayPlan
    //                 const updatedDayPlans = dayPlans.map((d) => {
    //                     if (d.day === expandedDay.day) {
    //                         return {
    //                             ...d,
    //                             routineId: routine.id,
    //                             workoutType: routine.type?.[0] || d.workoutType,
    //                         };
    //                     }
    //                     return d;
    //                 });

    //                 this.dayPlanSvc.setPlanDay(updatedDayPlans);

    //                 return expandedDay;
    //             }),
    //         )
    //         .subscribe();
    // }

    removeDayRoutine(dayToRemove: RoutineDayVM) {
        // this.dayPlanSvc.dayPlan$
        //     .pipe(
        //         take(1),
        //         map((dayPlans: DayPlan[]) => {
        //             if(this.plansSubject.getValue() === null) return null;
        //             const expandedDay = this.plansSubject.getValue().routineDays.find((r => r.day === dayToRemove.day))?.expanded
        //             if (!expandedDay) return null;
        //             const currentPlan = this.plansSubject.value;
        //             if (!currentPlan) return null;
        //             // ARREGLADO: Crear un routineDay vacío pero válido
        //             const emptyRoutine: RoutineDayVM = {
        //                 title: '',
        //                 kind: 'WORKOUT',
        //                 expanded: false,
        //                 day: expandedDay.day,
        //                 type: expandedDay.workoutType
        //                     ? [expandedDay.workoutType as ExerciseCategory]
        //                     : undefined,
        //             };
        //             const routineDays = currentPlan.routineDays.map((r, index) => {
        //                 if (index + 1 === expandedDay.day) {
        //                     return emptyRoutine;
        //                 }
        //                 return r;
        //             });
        //             const updatePlan: RoutinePlanVM = {
        //                 ...currentPlan,
        //                 routineDays,
        //             };
        //             this.setRoutinePlan(updatePlan);
        //             // IMPORTANTE: Actualizar también el DayPlan
        //             const updatedDayPlans = dayPlans.map((d) => {
        //                 if (d.day === expandedDay.day) {
        //                     return {
        //                         ...d,
        //                         routineId: undefined,
        //                         // Mantener el workoutType para poder cargar categorías
        //                     };
        //                 }
        //                 return d;
        //             });
        //             this.dayPlanSvc.setPlanDay(updatedDayPlans);
        //             return expandedDay;
        //         }),
        //     )
        //     .subscribe();
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
        this.setRoutinePlan(updated);
    }

    setDayRoutines(routine: RoutineDayVM[]) {
        this.setRoutinePlan({ ...this.currentValue(), routineDays: routine });
    }

    submitPlan(current: any): Observable<any> {
        //aca tambein debe llegar limpito
        return this.planApi.createPlan(current);
    }
}
