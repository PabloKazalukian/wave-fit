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

describe('PlanDayDomainService.createWorkout', () => {
    let service: PlanDayDomainService;
    let dayLog: DayLogVM | null;
    let api: { updateDayLog: jasmine.Spy; removeWorkoutSessionFromDayLog: jasmine.Spy };
    let state: {
        getDayLogValue: jasmine.Spy;
        setDayLog: jasmine.Spy;
        updateDayLog: jasmine.Spy;
        setLoadingWorkoutCreation: jasmine.Spy;
    };
    let storage: { setDayLogStorage: jasmine.Spy };

    const buildDayLog = (overrides: Partial<DayLogVM> = {}): DayLogVM => ({
        id: 'day-1',
        userId: 'user-1',
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
            updateDayLog: jasmine.createSpy('updateDayLog'),
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
            setLoadingWorkoutCreation: jasmine.createSpy('setLoadingWorkoutCreation'),
        };
        storage = { setDayLogStorage: jasmine.createSpy('setDayLogStorage') };

        TestBed.configureTestingModule({
            providers: [
                PlanDayDomainService,
                { provide: PlanDayApi, useValue: api },
                { provide: PlanDayStateService, useValue: state },
                { provide: PlanDayStorage, useValue: storage },
                {
                    provide: DateService,
                    useValue: { getUserTimezone: () => 'America/Argentina/Buenos_Aires' },
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
                {
                    provide: ActiveTrackingService,
                    useValue: {
                        markDayActive: jasmine.createSpy('markDayActive'),
                        clear: jasmine.createSpy('clear'),
                    },
                },
            ],
        });

        service = TestBed.inject(PlanDayDomainService);
    });

    it('sends a unified UpdateDayLog payload marking the workout complete', () => {
        api.updateDayLog.and.returnValue(of(dayLog));

        service.createWorkout('2026-05-01').subscribe();

        expect(api.updateDayLog).toHaveBeenCalledTimes(1);
        const payload = api.updateDayLog.calls.mostRecent().args[0];
        expect(payload.id).toBe('day-1');
        expect(payload.status).toBe('complete');
        expect(payload.timezone).toBe('America/Argentina/Buenos_Aires');
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
            { exerciseId: 'ex-1', series: 3, sets: [{ reps: 10, weights: 50 }], notes: undefined },
        ]);
    });

    it('toggles the loading flag around the request', () => {
        api.updateDayLog.and.returnValue(of(dayLog));

        service.createWorkout('2026-05-01').subscribe();

        expect(state.setLoadingWorkoutCreation.calls.first().args).toEqual(['2026-05-01', true]);
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
        expect(storage.setDayLogStorage).toHaveBeenCalledWith(updated, 'user-1');
    });

    it('does nothing when there is no active day-log', () => {
        dayLog = null;

        let result: DayLogVM | null | undefined;
        service.createWorkout('2026-05-01').subscribe((res) => (result = res));

        expect(result).toBeNull();
        expect(api.updateDayLog).not.toHaveBeenCalled();
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
