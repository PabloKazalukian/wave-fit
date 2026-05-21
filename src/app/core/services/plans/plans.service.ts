import { inject, Injectable, signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { BehaviorSubject, filter, Observable, take, tap, from, firstValueFrom } from 'rxjs';
import {
    DayIndex,
    RoutineDayVM,
    RoutinePlanSend,
    RoutinePlanVM,
} from '../../../shared/interfaces/routines.interface';
import { PlansStorageService } from './storage/plans.storage';
import { PlansApiService } from './api/plans.api';
import { wrapperRoutinePlanVMtoRoutinePlan } from '../../../shared/wrappers/plans.wrapper';
import { NetworkStatusService } from '../network/network-status.service';
import { SyncQueueService } from '../sync/sync-queue.service';
import { IndexedDbStorageService } from '../storage/indexed-db.service';

@Injectable({
    providedIn: 'root',
})
export class PlansService {
    private plansSubject = new BehaviorSubject<RoutinePlanVM | null>(null);
    routinePlanVM$ = this.plansSubject.pipe(filter((v): v is RoutinePlanVM => v !== null));
    userId = signal<string>('');

    private readonly authSvc = inject(AuthService);
    private readonly planStorage = inject(PlansStorageService);
    private readonly planApi = inject(PlansApiService);
    private readonly networkSvc = inject(NetworkStatusService);
    private readonly syncQueue = inject(SyncQueueService);
    private readonly idb = inject(IndexedDbStorageService);

    constructor() {
        this.syncQueue.registerHandler('CreateRoutinePlan', async (mutation) => {
            const input = mutation.variables.input;
            const res = await firstValueFrom(this.planApi.createPlan(input));
            return res;
        });
    }

    private generateObjectId(): string {
        const timestamp = Math.floor(new Date().getTime() / 1000).toString(16);
        const randomHex = 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, () => Math.floor(Math.random() * 16).toString(16));
        return (timestamp + randomHex).toLowerCase();
    }

    initPlanForUser(userId: string) {
        if (this.userId() !== '') {
            return;
        }
        const stored = this.planStorage.getPlanStorage(userId);

        this.userId.set(userId);

        if (stored) {
            this.plansSubject.next(stored);
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
        this.plansSubject.next(plan);
        this.planStorage.setPlanStorage(plan, this.userId());
        if (plan.id) {
            this.idb.savePlan(plan);
        }
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
                d.day === dayToRemove
                    ? {
                          day: d.day,
                          kind: 'REST' as const,
                          title: '',
                          expanded: d.expanded,
                          id: undefined,
                          type: undefined,
                          exercises: undefined,
                      }
                    : d,
            );
            const updatePlan: RoutinePlanVM = { ...plan, routineDays };
            this.setRoutinePlan(updatePlan);
        });
    }

    getRoutinePlan(): RoutinePlanVM | null {
        // const data = this.planStorage.getPlanStorage(idUser);
        return this.plansSubject.getValue();
    }
    getRoutinePlanById(id: string): Observable<RoutinePlanVM | null | undefined> {
        return this.planApi.getRoutinePlanById(id).pipe(
            tap((plan) => {
                if (plan && plan.id) {
                    this.idb.savePlan(plan);
                }
            })
        );
    }

    createRoutinePlan(planInput: RoutinePlanVM): RoutinePlanVM {
        const createdBy = this.authSvc.user()?.id;
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

    setWeeklyDistribution(distribution: string) {
        const plan = this.currentValue();
        const updated = { ...plan, weekly_distribution: distribution };
        this.setRoutinePlan(updated);
    }

    setExpandedDay(dayIndex: number) {
        const plan = this.currentValue();
        const routineDays = plan.routineDays.map((d, i) => ({
            ...d,
            expanded: i === dayIndex,
        }));
        this.setRoutinePlan({ ...plan, routineDays });
    }

    setDayRoutines(routineDays: RoutineDayVM[]) {
        this.setRoutinePlan({ ...this.currentValue(), routineDays });
    }

    submitPlan(current: RoutinePlanVM): Observable<any> {
        const payload = this.wrapperRoutinePlanVMtoRoutinePlan(current);
        const newId = current.id || this.generateObjectId();

        if (this.networkSvc.isOnline()) {
            return this.planApi.createPlan(payload).pipe(
                tap({
                    next: () => this.clearPlan(),
                })
            );
        } else {
            const pending = {
                id: newId,
                operationName: 'CreateRoutinePlan',
                variables: { input: payload },
                status: 'pending' as const,
                createdAt: Date.now()
            };
            
            return from(this.syncQueue.enqueue(pending).then(() => {
                this.clearPlan();
                return { ...payload, id: newId };
            }));
        }
    }

    validateTitleUnique(title: string): Observable<boolean | undefined> {
        return this.planApi.validateTitleUnique(title);
    }

    wrapperRoutinePlanVMtoRoutinePlan(routinePlanVM: RoutinePlanVM): RoutinePlanSend {
        return wrapperRoutinePlanVMtoRoutinePlan(routinePlanVM);
    }

    removePlan() {
        this.clearPlan();
    }

    private clearPlan() {
        this.plansSubject.next(null);
        this.planStorage.removePlanStorage(this.userId());
        this.userId.set('');
    }
}
