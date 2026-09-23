import { signal, WritableSignal } from '@angular/core';
import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';
import {
    StatusWorkoutSessionEnum,
    TrackingVM,
    TrackingVMS,
    WorkoutSessionVM,
} from '../../../shared/interfaces/tracking.interface';
import { WeekLogDayAPI } from '../../../shared/interfaces/api/tracking-api.interface';
import { AuthService } from '../auth/auth.service';
import { DateService } from '../date.service';
import { NetworkStatusService } from '../network/network-status.service';
import { RoutinesService } from '../routines/routines.service';
import { SyncQueueService } from '../sync/sync-queue.service';
import { ActiveTrackingService } from './active-tracking.service';
import { PlanTrackingApi } from './plan-tracking/api/plan-tranking.api';
import { PlanTrackingStorage } from './plan-tracking/storage/plan-tracking.storage';
import { PlanTrackingDomainService } from './plan-tracking.domain';
import { PlanTrackingStateService } from './plan-tracking.state';
import { WorkoutApi } from '../workouts/api/workout.api';

describe('PlanTrackingDomainService', () => {
    const TIMEZONE = 'America/Buenos_Aires';

    let service: PlanTrackingDomainService;
    let tracking: TrackingVM | null;
    let trackingSignal: WritableSignal<TrackingVM | null>;
    let api: {
        createTracking: jasmine.Spy;
        updateTrackingDay: jasmine.Spy;
        assignRoutineToDay: jasmine.Spy;
        removeExtraSession: jasmine.Spy;
        updateDayWorkoutStatus: jasmine.Spy;
        updateTracking: jasmine.Spy;
        getTrackingByUser: jasmine.Spy;
        removeWorkoutSession: jasmine.Spy;
        createRoutineByWorkout: jasmine.Spy;
    };
    let workoutApi: { updateWorkoutSession: jasmine.Spy };
    let state: {
        userId: WritableSignal<string>;
        tracking: WritableSignal<TrackingVM | null>;
        loadingWorkoutCreation: WritableSignal<{ date: string; state: boolean }>;
        setTracking: jasmine.Spy;
        getTrackingValue: jasmine.Spy;
        setLoading: jasmine.Spy;
        setLoadingTracking: jasmine.Spy;
        setLoadingStatusWorkout: jasmine.Spy;
    };
    let storage: { removeTrackingStorage: jasmine.Spy; setTrackingStorage: jasmine.Spy };
    let activeTracking: {
        activeTracking$: BehaviorSubject<unknown>;
        markWeekActive: jasmine.Spy;
        clear: jasmine.Spy;
    };
    let network: { isOnline: jasmine.Spy };
    let syncQueue: { registerHandler: jasmine.Spy; enqueue: jasmine.Spy };

    const buildWorkout = (overrides: Partial<WorkoutSessionVM> = {}): WorkoutSessionVM => ({
        id: 'ws-1',
        date: '2026-05-01',
        exercises: [],
        status: StatusWorkoutSessionEnum.NOT_STARTED,
        ...overrides,
    });

    const buildTracking = (overrides: Partial<TrackingVM> = {}): TrackingVM => ({
        id: 't-1',
        userId: 'user-1',
        startDate: '2026-04-27',
        endDate: '2026-05-03',
        workouts: [buildWorkout()],
        completed: false,
        active: false,
        ...overrides,
    });

    const buildDayApi = (overrides: Partial<WeekLogDayAPI> = {}): WeekLogDayAPI => ({
        order: 1,
        date: '2026-05-01',
        isRest: false,
        workoutSessionId: 'ws-1',
        extraSessionIds: [],
        status: 'complete',
        ...overrides,
    });

    const withTimezone = (timeZone: string) => {
        const resolved = new Intl.DateTimeFormat('en-US', { timeZone }).resolvedOptions();
        spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').and.returnValue(resolved);
    };

    beforeEach(() => {
        tracking = buildTracking();
        trackingSignal = signal<TrackingVM | null>(tracking);

        api = {
            createTracking: jasmine.createSpy('createTracking'),
            updateTrackingDay: jasmine.createSpy('updateTrackingDay'),
            assignRoutineToDay: jasmine.createSpy('assignRoutineToDay'),
            removeExtraSession: jasmine.createSpy('removeExtraSession'),
            updateDayWorkoutStatus: jasmine.createSpy('updateDayWorkoutStatus'),
            updateTracking: jasmine.createSpy('updateTracking'),
            getTrackingByUser: jasmine.createSpy('getTrackingByUser'),
            removeWorkoutSession: jasmine.createSpy('removeWorkoutSession'),
            createRoutineByWorkout: jasmine.createSpy('createRoutineByWorkout'),
        };
        workoutApi = { updateWorkoutSession: jasmine.createSpy('updateWorkoutSession') };

        state = {
            userId: signal(''),
            tracking: trackingSignal,
            loadingWorkoutCreation: signal({ date: '', state: false }),
            setTracking: jasmine
                .createSpy('setTracking')
                .and.callFake((next: TrackingVM | null) => {
                    tracking = next;
                    trackingSignal.set(next);
                }),
            getTrackingValue: jasmine.createSpy('getTrackingValue').and.callFake(() => tracking),
            setLoading: jasmine.createSpy('setLoading'),
            setLoadingTracking: jasmine.createSpy('setLoadingTracking'),
            setLoadingStatusWorkout: jasmine.createSpy('setLoadingStatusWorkout'),
        };
        storage = {
            removeTrackingStorage: jasmine.createSpy('removeTrackingStorage'),
            setTrackingStorage: jasmine.createSpy('setTrackingStorage'),
        };
        activeTracking = {
            activeTracking$: new BehaviorSubject<unknown>(null),
            markWeekActive: jasmine.createSpy('markWeekActive'),
            clear: jasmine.createSpy('clear'),
        };
        network = { isOnline: jasmine.createSpy('isOnline').and.returnValue(true) };
        syncQueue = {
            registerHandler: jasmine.createSpy('registerHandler'),
            enqueue: jasmine.createSpy('enqueue').and.resolveTo(undefined),
        };

        TestBed.configureTestingModule({
            providers: [
                PlanTrackingDomainService,
                { provide: PlanTrackingApi, useValue: api },
                { provide: WorkoutApi, useValue: workoutApi },
                { provide: PlanTrackingStateService, useValue: state },
                { provide: PlanTrackingStorage, useValue: storage },
                {
                    provide: DateService,
                    useValue: {
                        todayWeekRange: () => ({ start: '2026-04-27', end: '2026-05-03' }),
                        todayLocalDate: () => '2026-05-01',
                        getUserTimezone: () => TIMEZONE,
                        isSameLocalDate: (a: string, b: string) => a === b,
                    },
                },
                { provide: RoutinesService, useValue: { updateAllRoutines: () => of([]) } },
                { provide: NetworkStatusService, useValue: network },
                { provide: SyncQueueService, useValue: syncQueue },
                { provide: ActiveTrackingService, useValue: activeTracking },
                { provide: AuthService, useValue: { user$: new BehaviorSubject('user-1') } },
            ],
        });

        service = TestBed.inject(PlanTrackingDomainService);
    });

    describe('createTracking (TEST-001)', () => {
        it('builds the current-week range with the user timezone and persists it', () => {
            withTimezone(TIMEZONE);
            api.createTracking.and.returnValue(of(tracking));

            let result: TrackingVM | null | undefined;
            service.createTracking('plan-1').subscribe((res) => (result = res));

            expect(api.createTracking).toHaveBeenCalledWith({
                startDate: '2026-04-27',
                endDate: '2026-05-03',
                timezone: TIMEZONE,
                planId: 'plan-1',
            });
            expect(state.setTracking).toHaveBeenCalledWith(tracking);
            expect(activeTracking.markWeekActive).toHaveBeenCalledWith({
                id: 't-1',
                startDate: '2026-04-27',
                endDate: '2026-05-03',
                completed: false,
                active: true,
            });
            expect(result).toEqual(tracking);
        });
    });

    describe('createWorkout (TEST-003)', () => {
        it('sends a unified day payload with status complete', () => {
            api.updateTrackingDay.and.returnValue(of(buildDayApi()));

            service.createWorkout('2026-05-01').subscribe();

            const payload = api.updateTrackingDay.calls.mostRecent().args[0];
            expect(payload.id).toBe('t-1');
            expect(payload.timezone).toBe(TIMEZONE);
            expect(payload.days[0].order).toBe(1);
            expect(payload.days[0].isRest).toBe(false);
            expect(payload.days[0].status).toBe('complete');
            expect(payload.days[0].workoutSession.status).toBe(StatusWorkoutSessionEnum.COMPLETE);
        });

        it('returns the workout index and draft and toggles the loading flag', () => {
            api.updateTrackingDay.and.returnValue(of(buildDayApi()));

            let result: { index: number; workoutDraft: WorkoutSessionVM } | null | undefined;
            service.createWorkout('2026-05-01').subscribe((res) => (result = res));

            expect(result?.index).toBe(0);
            expect(state.loadingWorkoutCreation().state).toBe(false);
        });

        it('does nothing when the date is not part of the tracking', () => {
            let result: unknown;
            service.createWorkout('2026-06-01').subscribe((res) => (result = res));

            expect(result).toBeNull();
            expect(api.updateTrackingDay).not.toHaveBeenCalled();
        });

        it('sends workoutSession.id when the day already has one', () => {
            api.updateTrackingDay.and.returnValue(of(buildDayApi()));

            service.createWorkout('2026-05-01').subscribe();

            const payload = api.updateTrackingDay.calls.mostRecent().args[0];
            expect(payload.days[0].workoutSession.id).toBe('ws-1');
        });

        it('omits workoutSession.id when the day has no session (rest day)', () => {
            tracking = buildTracking({ workouts: [buildWorkout({ id: '' })] });
            trackingSignal.set(tracking);
            api.updateTrackingDay.and.returnValue(of(buildDayApi()));

            service.createWorkout('2026-05-01').subscribe();

            const payload = api.updateTrackingDay.calls.mostRecent().args[0];
            expect('id' in payload.days[0].workoutSession).toBeFalse();
            expect(payload.days[0].isRest).toBe(false);
            expect(payload.days[0].status).toBe('complete');
        });
    });

    describe('setRestDay (TEST-003)', () => {
        it('maps REST and NOT_STARTED to the isRest flag', () => {
            api.updateDayWorkoutStatus.and.returnValue(of(buildDayApi({ isRest: true })));

            service.setRestDay('2026-05-01', true).subscribe();
            expect(api.updateDayWorkoutStatus).toHaveBeenCalledWith('2026-05-01', true);

            service.setRestDay('2026-05-01', false).subscribe();
            expect(api.updateDayWorkoutStatus).toHaveBeenCalledWith('2026-05-01', false);
        });
    });

    describe('updateExercises (TEST-002)', () => {
        it('persists online through UpdateWeekLogDay', () => {
            api.updateTrackingDay.and.returnValue(of(buildDayApi()));

            service.updateExercises('2026-05-01', []).subscribe();

            const payload = api.updateTrackingDay.calls.mostRecent().args[0];
            expect(payload.id).toBe('t-1');
            expect(payload.days[0].order).toBe(1);
            expect(payload.days[0].workoutSession.date).toBe('2026-05-01');
            expect(payload.days[0].workoutSession.exercises).toEqual([]);
        });

        it('enqueues UpdateWeekLogDay when offline', fakeAsync(() => {
            network.isOnline.and.returnValue(false);

            service.updateExercises('2026-05-01', []).subscribe();
            flushMicrotasks();

            expect(api.updateTrackingDay).not.toHaveBeenCalled();
            const pending = syncQueue.enqueue.calls.mostRecent().args[0];
            expect(pending.operationName).toBe('UpdateWeekLogDay');
            expect(pending.variables.input.id).toBe('t-1');
        }));

        it('does nothing when there is no active tracking', () => {
            tracking = null;
            trackingSignal.set(null);

            let result: unknown;
            service.updateExercises('2026-05-01', []).subscribe((res) => (result = res));

            expect(result).toBeNull();
            expect(syncQueue.enqueue).not.toHaveBeenCalled();
        });
    });

    describe('completeTracking (TEST-004)', () => {
        it('deactivates the week, pads the 7 days and cleans state/storage', () => {
            withTimezone(TIMEZONE);
            const completed = { ...tracking, completed: true } as TrackingVMS;
            api.updateTracking.and.returnValue(of(completed));
            state.userId.set('user-1');

            service.completeTracking(true).subscribe();

            const payload = api.updateTracking.calls.mostRecent().args[0];
            expect(payload.id).toBe('t-1');
            expect(payload.completed).toBe(true);
            expect(payload.active).toBe(false);
            expect(payload.startDate).toBe('2026-04-27');
            expect(payload.endDate).toBe('2026-05-03');
            expect(payload.timezone).toBe(TIMEZONE);
            expect(payload.days.length).toBe(7);
            expect(payload.days[0]).toEqual(
                jasmine.objectContaining({ order: 1, workoutSessionId: 'ws-1' }),
            );
            expect(payload.days[6]).toEqual(jasmine.objectContaining({ order: 7 }));

            expect(state.setLoading.calls.first().args).toEqual([true]);
            expect(state.setLoading.calls.mostRecent().args).toEqual([false]);
            expect(storage.removeTrackingStorage).toHaveBeenCalledWith('user-1');
            expect(state.setTracking).toHaveBeenCalledWith(null);
            expect(activeTracking.clear).toHaveBeenCalledTimes(1);
        });

        it('does nothing when there is no active tracking', () => {
            tracking = null;
            trackingSignal.set(null);

            let result: unknown;
            service.completeTracking(true).subscribe((res) => (result = res));

            expect(result).toBeNull();
            expect(api.updateTracking).not.toHaveBeenCalled();
            expect(state.setLoading).not.toHaveBeenCalled();
        });
    });
});
