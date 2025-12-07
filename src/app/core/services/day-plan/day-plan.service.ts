import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, filter } from 'rxjs';
import {
    DayIndex,
    DayPlan,
    KindEnum,
    RoutineDay,
    RoutinePlan,
    RoutinePlanCreate,
} from '../../../shared/interfaces/routines.interface';
import { PlansService } from '../plans/plans.service';
import { DayPlanStorageService } from './storage/day-plan-storage.service';

@Injectable({
    providedIn: 'root',
})
export class DayPlanService {
    private dayPlanSubject = new BehaviorSubject<DayPlan[] | null>(null);
    dayPlan$ = this.dayPlanSubject.pipe(filter((v): v is DayPlan[] => v !== null));

    userId = signal<string>('');

    constructor(
        private dayPlanStorage: DayPlanStorageService,
        // private planRoutineSvc: PlansService,
    ) {}

    initDayPlan(userId: string) {
        const stored = this.dayPlanStorage.getDayPlanStorage(userId);
        this.userId.set(userId);

        if (stored) {
            this.dayPlanSubject.next(stored);
        } else {
            let arr = new Array(7).fill({});
            arr = arr.map((e, index) => {
                return this.createDayPlanEmpty(index as DayIndex);
            });
            arr[0].expanded = true;
            this.dayPlanSubject.next(arr);
            this.dayPlanStorage.setDayPlanStorage(arr, userId);
        }

        // this.planSvc.routinePlan$.subscribe({
        //     next: (plan) => {
        //         // console.log(plan);
        //         let dayplan = this.dayPlanSubject.value;
        //         if (plan.weekly_distribution && dayplan) {
        //             for (let i = 0; i < parseInt(plan.weekly_distribution); i++) {
        //                 dayplan[i] = this.createDayPlanEmpty(i as DayIndex);
        //                 dayplan[i].kind = 'WORKOUT';
        //             }
        //             this.dayPlanSubject.next(dayplan);
        //         }
        //     },
        // });
    }

    private createDayPlanEmpty(i: DayIndex): DayPlan {
        return {
            day: i,
            kind: 'REST',
            workoutType: undefined, // ex: "CHEST"
            routineId: undefined,
            expanded: false,
        };
    }
    changeDayPlanExpanded(day: DayPlan) {
        let dayPlans = this.dayPlanSubject.value;
        if (dayPlans) {
            dayPlans = dayPlans?.map((d) => {
                if (d.day === day.day) {
                    d.expanded = true;
                } else {
                    d.expanded = false;
                }
                return d;
            });
            this.setPlanDay(dayPlans);
        }
    }

    setDay(day: DayPlan) {
        const arr = this.dayPlanSubject.value;
        const update = arr?.map((e) => (e.day === day.day ? day : e));
        if (update) this.setPlanDay(update);
    }

    setPlanDay(dayPlans: DayPlan[]) {
        this.dayPlanSubject.next(dayPlans);
        this.dayPlanStorage.setDayPlanStorage(dayPlans, this.userId());
    }

    changeDayPlan(planRoutine: RoutinePlanCreate | RoutinePlan) {
        console.log(planRoutine);
        const updateDayPlan: DayPlan[] = planRoutine.routineDays.map((r, index): DayPlan => {
            if (r === null) {
                return this.createDayPlanEmpty((index + 1) as DayIndex);
            }
            return {
                day: (index + 1) as DayIndex,
                kind: KindEnum.workout,
                workoutType: r.type?.join(','), // ex: "CHEST"
                routineId: r.id,
                expanded: this.getDayPlanByIndex((index + 1) as DayIndex)?.expanded,
            };
        });

        this.setPlanDay(updateDayPlan);
    }

    private getDayPlanByIndex(index: DayIndex): DayPlan | undefined {
        return this.dayPlanSubject.value?.find((e) => e.day === index);
    }
}
