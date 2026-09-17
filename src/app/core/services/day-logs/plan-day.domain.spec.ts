import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DayLogVM } from '../../../shared/interfaces/day-log.interface';
import { ExerciseCategory } from '../../../shared/interfaces/exercise.interface';
import { StatusWorkoutSessionEnum } from '../../../shared/interfaces/tracking.interface';
import { DateService } from '../date.service';
import { NetworkStatusService } from '../network/network-status.service';
import { RoutinesService } from '../routines/routines.service';
import { SyncQueueService } from '../sync/sync-queue.service';
import { ActiveTrackingService } from '../trackings/active-tracking.service';
import { PlanDayApi } from './plan-day/api/plan-day.api';
import { PlanDayStorage } from './plan-day/storage/plan-day.storage';
import { PlanDayDomainService } from './plan-day.domain';
import { PlanDayStateService } from './plan-day.state';

describe('PlanDayDomainService', () => {
    const USER_ID = 'user-1';
    const TIMEZONE = 'America/Argentina/Buenos_Aires';

    let service: PlanDayDomainService;
    let dayLog: DayLogVM | null;
    let api: {
        createDayLog: jasmine.Spy;
        updateDayLog: jasmine.Spy;
        updateDayLogStatus: jasmine.Spy;
        assignRoutineToDayLog: jasmine.Spy;
        getActiveDayLog: jasmine.Spy;
        removeWorkoutSessionFromDayLog: jasmine.Spy;
    };
    let state: {
        getDayLogValue: jasmine.Spy;
        setDayLog: jasmine.Spy;
        updateDayLog: jasmine.Spy;
        setLoading: jasmine.Spy;
        setLoadingWorkoutCreation: jasmine.Spy;
    };
    let storage: { setDayLogStorage: jasmine.Spy; removeDayLogStorage: jasmine.Spy };
    let activeTracking: { markDayActive: jasmine.Spy; clear: jasmine.Spy };

    const buildDayLog = (overrides: Partial<DayLogVM> = {}): DayLogVM => ({
        id: 'day-1',
        userId: USER_ID,
        date: '2026-05-01',
        extraSessionIds: [],
        status: 'pending',
        active: true,
        completed: false,
        exercises: [],
        ...overrides,
    });

    beforeEach(() => {
        dayLog = buildDayLog();

        api = {
            createDayLog: jasmine.createSpy('createDayLog'),
            updateDayLog: jasmine.createSpy('updateDayLog'),
            updateDayLogStatus: jasmine.createSpy('updateDayLogStatus'),
            assignRoutineToDayLog: jasmine.createSpy('assignRoutineToDayLog'),
            getActiveDayLog: jasmine.createSpy('getActiveDayLog'),
            removeWorkoutSessionFromDayLog: jasmine.createSpy('removeWorkoutSessionFromDayLog'),
        };
        state = {
            getDayLogValue: jasmine.createSpy('getDayLogValue').and.callFake(() => dayLog),
            setDayLog: jasmine.createSpy('setDayLog').and.callFake((next: DayLogVM | null) => {
                dayLog = next;
            }),
            updateDayLog: jasmine
                .createSpy('updateDayLog')
                .and.callFake((updater: (d: DayLogVM) => DayLogVM) => {
                    if (dayLog) {
                        dayLog = updater(dayLog);
                    }
                }),
            setLoading: jasmine.createSpy('setLoading'),
            setLoadingWorkoutCreation: jasmine.createSpy('setLoadingWorkoutCreation'),
        };
        storage = {
            setDayLogStorage: jasmine.createSpy('setDayLogStorage'),
            removeDayLogStorage: jasmine.createSpy('removeDayLogStorage'),
        };
        activeTracking = {
            markDayActive: jasmine.createSpy('markDayActive'),
            clear: jasmine.createSpy('clear'),
        };

        TestBed.configureTestingModule({
            providers: [
                PlanDayDomainService,
                { provide: PlanDayApi, useValue: api },
                { provide: PlanDayStateService, useValue: state },
                { provide: PlanDayStorage, useValue: storage },
                {
                    provide: DateService,
                    useValue: {
                        getUserTimezone: () => TIMEZONE,
                        todayLocalDate: () => '2026-05-01',
                    },
                },
                { provide: RoutinesService, useValue: { updateAllRoutines: () => of([]) } },
                { provide: NetworkStatusService, useValue: { isOnline: () => true } },
                {
                    provide: SyncQueueService,
                    useValue: {
                        registerHandler: jasmine.createSpy('registerHandler'),
                        enqueue: jasmine.createSpy('enqueue'),
                    },
                },
                { provide: ActiveTrackingService, useValue: activeTracking },
            ],
        });

        service = TestBed.inject(PlanDayDomainService);
    });

    describe('createDayLog', () => {
        it('sends the user timezone (IANA) with the provided date, plan and routine day', () => {
            const created = buildDayLog({ id: 'day-2', date: '2026-05-02' });
            api.createDayLog.and.returnValue(of(created));

            service.createDayLog('plan-1', '2026-05-02', 'rd-1').subscribe();

            expect(api.createDayLog).toHaveBeenCalledWith({
                date: '2026-05-02',
                timezone: TIMEZONE,
                planId: 'plan-1',
                routineDayId: 'rd-1',
            });
        });

        it('defaults the date to today in the user timezone', () => {
            api.createDayLog.and.returnValue(of(dayLog));

            service.createDayLog().subscribe();

            const payload = api.createDayLog.calls.mostRecent().args[0];
            expect(payload.date).toBe('2026-05-01');
            expect(payload.timezone).toBe(TIMEZONE);
            expect(payload.planId).toBeUndefined();
            expect(payload.routineDayId).toBeUndefined();
        });

        it('stores the created day-log and marks the day as active', () => {
            const created = buildDayLog({ id: 'day-2', date: '2026-05-02' });
            api.createDayLog.and.returnValue(of(created));

            let result: DayLogVM | null | undefined;
            service.createDayLog('plan-1', '2026-05-02').subscribe((res) => (result = res));

            expect(result).toEqual(created);
            expect(state.setDayLog).toHaveBeenCalledWith(created);
            expect(storage.setDayLogStorage).toHaveBeenCalledWith(created, USER_ID);
            expect(activeTracking.markDayActive).toHaveBeenCalledWith({
                id: 'day-2',
                date: '2026-05-02',
                completed: false,
                active: true,
                status: 'pending',
            });
        });
    });

    describe('createWorkout', () => {
        it('sends a unified UpdateDayLog payload marking the workout complete', () => {
            api.updateDayLog.and.returnValue(of(dayLog));

            service.createWorkout('2026-05-01').subscribe();

            expect(api.updateDayLog).toHaveBeenCalledTimes(1);
            const payload = api.updateDayLog.calls.mostRecent().args[0];
            expect(payload.id).toBe('day-1');
            expect(payload.status).toBe('complete');
            expect(payload.timezone).toBe(TIMEZONE);
            expect(payload.completed).toBeUndefined();
            expect(payload.workoutSession.status).toBe(StatusWorkoutSessionEnum.COMPLETE);
            expect(payload.workoutSession.date).toBe('2026-05-01');
            expect(payload.workoutSession.id).toBeUndefined();
        });

        it('links the existing workout session when the day already has one', () => {
            dayLog = buildDayLog({ workoutSessionId: 'ws-9' });
            api.updateDayLog.and.returnValue(of(dayLog));

            service.createWorkout('2026-05-01').subscribe();

            expect(api.updateDayLog.calls.mostRecent().args[0].workoutSession.id).toBe('ws-9');
        });

        it('maps the day exercises into the workout session payload', () => {
            dayLog = buildDayLog({
                exercises: [
                    {
                        exerciseId: 'ex-1',
                        name: 'Press banca',
                        category: ExerciseCategory.CHEST,
                        usesWeight: true,
                        series: 3,
                        sets: [{ reps: 10, weights: 50 }],
                    },
                ],
            });
            api.updateDayLog.and.returnValue(of(dayLog));

            service.createWorkout('2026-05-01').subscribe();

            expect(api.updateDayLog.calls.mostRecent().args[0].workoutSession.exercises).toEqual([
                {
                    exerciseId: 'ex-1',
                    series: 3,
                    sets: [{ reps: 10, weights: 50 }],
                    notes: undefined,
                },
            ]);
        });

        it('toggles the loading flag around the request', () => {
            api.updateDayLog.and.returnValue(of(dayLog));

            service.createWorkout('2026-05-01').subscribe();

            expect(state.setLoadingWorkoutCreation.calls.first().args).toEqual([
                '2026-05-01',
                true,
            ]);
            expect(state.setLoadingWorkoutCreation.calls.mostRecent().args).toEqual([
                '2026-05-01',
                false,
            ]);
        });

        it('stores the returned day-log as the new state', () => {
            const updated = buildDayLog({ status: 'complete', workoutSessionId: 'ws-1' });
            api.updateDayLog.and.returnValue(of(updated));

            let result: DayLogVM | null | undefined;
            service.createWorkout('2026-05-01').subscribe((res) => (result = res));

            expect(result).toEqual(updated);
            expect(state.setDayLog).toHaveBeenCalledWith(updated);
            expect(storage.setDayLogStorage).toHaveBeenCalledWith(updated, USER_ID);
        });

        it('does nothing when there is no active day-log', () => {
            dayLog = null;

            let result: DayLogVM | null | undefined;
            service.createWorkout('2026-05-01').subscribe((res) => (result = res));

            expect(result).toBeNull();
            expect(api.updateDayLog).not.toHaveBeenCalled();
        });
    });

    describe('createWorkoutWithRoutine', () => {
        it('seeds the day exercises from the routine day', () => {
            api.assignRoutineToDayLog.and.returnValue(
                of({ id: 'day-1', routineDayId: 'rd-1', workoutSessionId: 'ws-1' }),
            );
            const seeded = buildDayLog({
                routineDayId: 'rd-1',
                workoutSessionId: 'ws-1',
                exercises: [
                    {
                        exerciseId: 'ex-1',
                        name: 'Press banca',
                        category: ExerciseCategory.CHEST,
                        usesWeight: true,
                        series: 3,
                        sets: [{ reps: 10, weights: 50 }],
                    },
                ],
            });
            api.getActiveDayLog.and.returnValue(of(seeded));

            let result: DayLogVM | null | undefined;
            service
                .createWorkoutWithRoutine('rd-1', '2026-05-01')
                .subscribe((res) => (result = res));

            expect(api.assignRoutineToDayLog).toHaveBeenCalledWith('rd-1', '2026-05-01');
            expect(api.getActiveDayLog).toHaveBeenCalledTimes(1);
            expect(result).toEqual(seeded);
            expect(result?.exercises?.length).toBe(1);
            expect(state.setDayLog).toHaveBeenCalledWith(seeded);
            expect(storage.setDayLogStorage).toHaveBeenCalledWith(seeded, USER_ID);
        });

        it('keeps the current day-log when the mutation returns no workout session', () => {
            api.assignRoutineToDayLog.and.returnValue(of({ id: 'day-1', routineDayId: 'rd-1' }));

            let result: DayLogVM | null | undefined;
            service
                .createWorkoutWithRoutine('rd-1', '2026-05-01')
                .subscribe((res) => (result = res));

            expect(api.getActiveDayLog).not.toHaveBeenCalled();
            expect(result).toEqual(dayLog);
        });

        it('does nothing when there is no active day-log', () => {
            dayLog = null;

            let result: DayLogVM | null | undefined;
            service
                .createWorkoutWithRoutine('rd-1', '2026-05-01')
                .subscribe((res) => (result = res));

            expect(result).toBeNull();
            expect(api.assignRoutineToDayLog).not.toHaveBeenCalled();
        });
    });

    describe('completeDayLog', () => {
        it('closes the day sending completed:true and clears the local state', () => {
            api.updateDayLog.and.returnValue(of({ id: 'day-1', completed: true, active: false }));

            service.completeDayLog(true).subscribe();

            expect(api.updateDayLog).toHaveBeenCalledWith({ id: 'day-1', completed: true });
            expect(storage.removeDayLogStorage).toHaveBeenCalledWith(USER_ID);
            expect(state.setDayLog).toHaveBeenCalledWith(null);
            expect(activeTracking.clear).toHaveBeenCalledTimes(1);
            expect(state.setLoading.calls.first().args).toEqual([true]);
            expect(state.setLoading.calls.mostRecent().args).toEqual([false]);
        });

        it('is idempotent: does not call the api again once the day is closed', () => {
            dayLog = null;

            let result: DayLogVM | null | undefined;
            service.completeDayLog(true).subscribe((res) => (result = res));

            expect(result).toBeNull();
            expect(api.updateDayLog).not.toHaveBeenCalled();
            expect(state.setLoading).not.toHaveBeenCalled();
        });
    });

    describe('removeWorkoutSession', () => {
        it('clears the flat session locally even when the api returns a clone with stale exercises', () => {
            dayLog = buildDayLog({
                workoutSessionId: 'ws-1',
                status: 'complete',
                exercises: [
                    {
                        exerciseId: 'ex-1',
                        name: 'Press banca',
                        category: ExerciseCategory.CHEST,
                        usesWeight: true,
                        series: 3,
                        sets: [{ reps: 10, weights: 50 }],
                    },
                ],
            });
            api.removeWorkoutSessionFromDayLog.and.returnValue(of({ ...dayLog }));

            let result: DayLogVM | null | undefined;
            service.removeWorkoutSession('ws-1').subscribe((res) => (result = res));

            expect(result?.workoutSessionId).toBeUndefined();
            expect(result?.exercises).toEqual([]);
            expect(result?.status).toBe('pending');
        });

        it('does nothing when the api returns no data', () => {
            dayLog = buildDayLog({ workoutSessionId: 'ws-1', status: 'complete' });
            api.removeWorkoutSessionFromDayLog.and.returnValue(of(null));

            service.removeWorkoutSession('ws-1').subscribe();

            expect(state.updateDayLog).not.toHaveBeenCalled();
        });
    });
});
