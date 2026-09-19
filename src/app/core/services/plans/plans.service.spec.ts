import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';
import { RoutinePlanSend, RoutinePlanVM } from '../../../shared/interfaces/routines.interface';
import { AuthService } from '../auth/auth.service';
import { NetworkStatusService } from '../network/network-status.service';
import { IndexedDbStorageService } from '../storage/indexed-db.service';
import { SyncQueueService } from '../sync/sync-queue.service';
import { PlansApiService } from './api/plans.api';
import { PlansService } from './plans.service';
import { PlansStorageService } from './storage/plans.storage';

describe('PlansService', () => {
    let service: PlansService;
    let planApi: {
        createPlan: jasmine.Spy;
        validateTitleUnique: jasmine.Spy;
        getRoutinePlanById: jasmine.Spy;
    };
    let planStorage: {
        getPlanStorage: jasmine.Spy;
        setPlanStorage: jasmine.Spy;
        removePlanStorage: jasmine.Spy;
    };
    let network: { isOnline: jasmine.Spy };
    let syncQueue: { registerHandler: jasmine.Spy; enqueue: jasmine.Spy };

    const buildPlan = (overrides: Partial<RoutinePlanVM> = {}): RoutinePlanVM =>
        ({
            name: 'Plan A',
            description: 'Desc',
            weekly_distribution: '1,2,3,4,5,6,7',
            createdBy: 'user-1',
            routineDays: service.initRoutineDays(),
            ...overrides,
        }) as RoutinePlanVM;

    beforeEach(() => {
        planApi = {
            createPlan: jasmine.createSpy('createPlan').and.returnValue(of(null)),
            validateTitleUnique: jasmine.createSpy('validateTitleUnique').and.returnValue(of(true)),
            getRoutinePlanById: jasmine.createSpy('getRoutinePlanById').and.returnValue(of(null)),
        };
        planStorage = {
            getPlanStorage: jasmine.createSpy('getPlanStorage').and.returnValue(null),
            setPlanStorage: jasmine.createSpy('setPlanStorage'),
            removePlanStorage: jasmine.createSpy('removePlanStorage'),
        };
        network = { isOnline: jasmine.createSpy('isOnline').and.returnValue(true) };
        syncQueue = {
            registerHandler: jasmine.createSpy('registerHandler'),
            enqueue: jasmine.createSpy('enqueue').and.resolveTo(undefined),
        };

        TestBed.configureTestingModule({
            providers: [
                PlansService,
                { provide: PlansApiService, useValue: planApi },
                { provide: PlansStorageService, useValue: planStorage },
                { provide: NetworkStatusService, useValue: network },
                { provide: SyncQueueService, useValue: syncQueue },
                {
                    provide: IndexedDbStorageService,
                    useValue: { savePlan: jasmine.createSpy('savePlan') },
                },
                {
                    provide: AuthService,
                    useValue: { user$: new BehaviorSubject(null), user: () => ({ id: 'user-1' }) },
                },
            ],
        });

        service = TestBed.inject(PlansService);
    });

    describe('initPlanForUser', () => {
        it('seeds a 7-day plan with day 1 expanded and persists it', () => {
            service.initPlanForUser('user-1');

            const plan = service.currentValue();
            expect(service.userId()).toBe('user-1');
            expect(plan.routineDays.length).toBe(7);
            expect(plan.routineDays[0].expanded).toBe(true);
            expect(plan.routineDays[1].kind).toBe('REST');
            expect(planStorage.setPlanStorage).toHaveBeenCalledWith(plan, 'user-1');
        });

        it('restores a stored plan for the user', () => {
            const stored = buildPlan({ id: 'plan-9' });
            planStorage.getPlanStorage.and.returnValue(stored);

            service.initPlanForUser('user-1');

            expect(service.getRoutinePlan()).toEqual(stored);
            expect(planStorage.setPlanStorage).not.toHaveBeenCalled();
        });
    });

    describe('validateTitleUnique (TEST-001)', () => {
        it('delegates to the API and surfaces the duplicate result', () => {
            planApi.validateTitleUnique.and.returnValue(of(false));

            let result: boolean | undefined;
            service.validateTitleUnique('Plan A').subscribe((res) => (result = res));

            expect(planApi.validateTitleUnique).toHaveBeenCalledWith('Plan A');
            expect(result).toBe(false);
        });
    });

    describe('submitPlan (TEST-002 / TEST-003)', () => {
        it('calls createPlan with day ids and clears the local plan when online', () => {
            service.initPlanForUser('user-1');
            service.setRoutinePlan(buildPlan());
            const plan = service.currentValue();
            plan.routineDays[0] = { ...plan.routineDays[0], id: 'rd-1' };
            planApi.createPlan.and.returnValue(of({ id: 'plan-1' }));

            service.submitPlan(plan).subscribe();

            const payload: RoutinePlanSend = planApi.createPlan.calls.mostRecent().args[0];
            expect(payload.name).toBe('Plan A');
            expect(payload.routineDays[0]).toBe('rd-1');
            expect(payload.routineDays[1]).toBe('');
            expect(planStorage.removePlanStorage).toHaveBeenCalledWith('user-1');
            expect(service.userId()).toBe('');
            expect(service.getRoutinePlan()).toBeNull();
        });

        it('enqueues CreateRoutinePlan and returns a local id when offline', fakeAsync(() => {
            network.isOnline.and.returnValue(false);
            service.initPlanForUser('user-1');
            service.setRoutinePlan(buildPlan());
            const plan = service.currentValue();

            let result: { id?: string } | undefined;
            service.submitPlan(plan).subscribe((res) => (result = res));
            flushMicrotasks();

            const pending = syncQueue.enqueue.calls.mostRecent().args[0];
            expect(pending.operationName).toBe('CreateRoutinePlan');
            expect(pending.variables.input.name).toBe('Plan A');
            expect(typeof result?.id).toBe('string');
            expect(result?.id).not.toBe('');
            expect(service.getRoutinePlan()).toBeNull();
            expect(planStorage.removePlanStorage).toHaveBeenCalledWith('user-1');
        }));
    });

    describe('day-level edits (TEST-004)', () => {
        it('setExpandedDay expands only the selected day', () => {
            service.initPlanForUser('user-1');

            service.setExpandedDay(3);

            const days = service.currentValue().routineDays;
            expect(days[3].expanded).toBe(true);
            expect(days[0].expanded).toBe(false);
            expect(days.filter((d) => d.expanded).length).toBe(1);
        });

        it('setDayRoutine and setWeeklyDistribution update and persist the plan', () => {
            service.initPlanForUser('user-1');
            const routine = {
                ...service.initRoutineDays()[0],
                title: 'Push',
                kind: 'WORKOUT' as const,
            };

            service.setDayRoutine(0, routine);
            service.setWeeklyDistribution('1,3,5');

            expect(service.currentValue().routineDays[0]).toEqual(routine);
            expect(service.currentValue().weekly_distribution).toBe('1,3,5');
            expect(planStorage.setPlanStorage).toHaveBeenCalled();
        });

        it('removeDayRoutine resets the target day to an empty REST day', () => {
            service.initPlanForUser('user-1');
            const custom = {
                ...service.initRoutineDays()[0],
                title: 'Push',
                kind: 'WORKOUT' as const,
                id: 'rd-1',
                exercises: [],
            };
            service.setDayRoutine(0, custom);

            service.removeDayRoutine(1);

            const day = service.currentValue().routineDays[0];
            expect(day.kind).toBe('REST');
            expect(day.title).toBe('');
            expect(day.id).toBeUndefined();
            expect(day.exercises).toBeUndefined();
        });
    });

    describe('removePlan', () => {
        it('clears state, storage and the user id', () => {
            service.initPlanForUser('user-1');

            service.removePlan();

            expect(service.getRoutinePlan()).toBeNull();
            expect(planStorage.removePlanStorage).toHaveBeenCalledWith('user-1');
            expect(service.userId()).toBe('');
        });
    });
});
