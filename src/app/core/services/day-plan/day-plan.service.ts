import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, filter } from 'rxjs';
import {
    DayIndex,
    DayPlan,
    KindEnum,
    KindType,
    RoutinePlanCreate,
    RoutinePlanVM,
} from '../../../shared/interfaces/routines.interface';
import { DayPlanStorageService } from './storage/day-plan-storage.service';

@Injectable({
    providedIn: 'root',
})
export class DayPlanService {
    private dayPlanSubject = new BehaviorSubject<DayPlan[] | null>(null);
    dayPlan$ = this.dayPlanSubject.pipe(filter((v): v is DayPlan[] => v !== null));

    userId = signal<string>('');

    constructor(private dayPlanStorage: DayPlanStorageService) {}

    initDayPlan(userId: string, plan?: RoutinePlanCreate) {
        this.userId.set(userId);
        const stored = this.getDayPlanStorage();

        if (stored) {
            if (plan) {
                console.log(plan, stored);
                this.createDayPlanFromPlan(plan, stored);
                return;
            }

            this.userId.set(userId);

            this.dayPlanSubject.next(stored);
        } else {
            let arr = new Array(7).fill({});
            arr = arr.map((e, index) => {
                return this.createDayPlanEmpty(index as DayIndex);
            });
            arr[0].expanded = true;
            this.dayPlanSubject.next(arr);
            this.setDayPlanStorage(arr);
        }
    }

    createDayPlanFromPlan(plan: RoutinePlanCreate, stored?: DayPlan[]) {
        // Create DayPlan from RoutinePlanCreate, with control in first step if exist kind workout else create empty, second
        const updateDayPlan: DayPlan[] = plan.routineDays.map((r, index): DayPlan => {
            if (r.kind === null || r.kind === undefined) {
                return this.createDayPlanEmpty((index + 1) as DayIndex);
            }
            if (r.type === undefined || r.type === null) {
                return this.createDayPlanEmpty((index + 1) as DayIndex, r.kind);
            }
            return {
                day: (index + 1) as DayIndex,
                kind: KindEnum.workout,
                workoutType: r.type?.join(','), // ex: "CHEST"
                routineId: r.id,
                expanded: this.getDayPlanByIndex((index + 1) as DayIndex)?.expanded,
            };
        });

        this.dayPlanSubject.next(updateDayPlan);
        this.setDayPlanStorage(updateDayPlan);
        if (stored) {
            this.changeDayPlanExpanded(
                updateDayPlan[stored.findIndex((s) => s.expanded) as DayIndex],
            );
        } else {
            const emptyDayPlan = this.createDayPlanEmpty(1);
            emptyDayPlan.expanded = true;
            this.dayPlanSubject.next([emptyDayPlan]);
            this.setDayPlanStorage([emptyDayPlan]);
        }
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
        this.setDayPlanStorage(dayPlans);
    }

    changeDayPlan(planRoutine: RoutinePlanVM) {
        const currentDayPlans = this.dayPlanSubject.value || [];

        const updateDayPlan: DayPlan[] = planRoutine.routineDays.map((r, index): DayPlan => {
            const dayIndex = (index + 1) as DayIndex;
            const existingDay = currentDayPlans.find((d) => d.day === dayIndex);

            // Mantener el expanded del día existente
            const expanded = existingDay?.expanded || false;

            if (!r.kind || r.kind === null) {
                return this.createDayPlanEmpty(dayIndex, undefined, expanded);
            }

            if (!r.type || r.type.length === 0) {
                return this.createDayPlanEmpty(dayIndex, r.kind, expanded);
            }

            return {
                day: dayIndex,
                kind: r.kind,
                workoutType: r.type?.join(','),
                routineId: r.id,
                expanded,
            };
        });

        this.setPlanDay(updateDayPlan);
    }

    //plan.routinesDays if null is no selected , if kind: rest in DayPlan is kind:REST , if Type no empty is kind:WORKOUT with workoutType: ej "CHEST" but no id in dayplan is routineId: null, with id is the complate state of Dayplan with routineId not null

    private createDayPlanEmpty(i: DayIndex, kind?: KindType, expanded: boolean = false): DayPlan {
        return {
            day: i,
            kind: kind || null,
            workoutType: undefined,
            routineId: undefined,
            expanded,
        };
    }

    private getDayPlanByIndex(index: DayIndex): DayPlan | undefined {
        return this.dayPlanSubject.value?.find((e) => e.day === index);
    }

    private setDayPlanStorage(payload: DayPlan[]) {
        this.dayPlanStorage.setDayPlanStorage(payload, this.userId());
    }

    private getDayPlanStorage(): DayPlan[] | null {
        return this.dayPlanStorage.getDayPlanStorage(this.userId());
    }
}
