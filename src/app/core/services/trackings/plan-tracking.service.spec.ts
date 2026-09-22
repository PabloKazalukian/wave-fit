import { signal, WritableSignal } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';
import { ExerciseCategory } from '../../../shared/interfaces/exercise.interface';
import {
    ExercisePerformanceVM,
    StatusWorkoutSessionEnum,
    TrackingVM,
    TrackingVMS,
    WorkoutSessionVM,
} from '../../../shared/interfaces/tracking.interface';
import { WeekLogDayVM } from '../../../shared/interfaces/tracking.interface';
import { AuthService } from '../auth/auth.service';
import { DateService } from '../date.service';
import { PlanTrackingStorage } from './plan-tracking/storage/plan-tracking.storage';
import { PlanTrackingDomainService } from './plan-tracking.domain';
import { PlanTrackingService } from './plan-tracking.service';
import { PlanTrackingStateService } from './plan-tracking.state';

describe('PlanTrackingService', () => {
    let service: PlanTrackingService;
    let tracking: TrackingVM | null;
    let trackingSignal: WritableSignal<TrackingVM | null>;
    let trackingSubject: BehaviorSubject<TrackingVM | null>;
    let dateService: { isSameLocalDate: (a: string, b: string) => boolean };
    let domain: {
        initTracking: jasmine.Spy;
        createTracking: jasmine.Spy;
        createWorkout: jasmine.Spy;
        createWorkoutWithRoutine: jasmine.Spy;
        updateExercises: jasmine.Spy;
        setRestDay: jasmine.Spy;
        removeExtraSession: jasmine.Spy;
        removeWorkoutSession: jasmine.Spy;
        updateWorkoutSession: jasmine.Spy;
        completeTracking: jasmine.Spy;
        createRoutineFromWorkout: jasmine.Spy;
    };
    let state: {
        tracking: WritableSignal<TrackingVM | null>;
        tracking$: BehaviorSubject<TrackingVM | null>;
        loading: WritableSignal<boolean>;
        loadingTracking: WritableSignal<boolean>;
        loadingWorkoutCreation: WritableSignal<{ date: string; state: boolean }>;
        loadingStatusWorkout: WritableSignal<boolean>;
        userId: WritableSignal<string>;
        setTracking: jasmine.Spy;
        getTrackingValue: jasmine.Spy;
        updateWorkout: jasmine.Spy;
        setLoadingTracking: jasmine.Spy;
        setLoadingStatusWorkout: jasmine.Spy;
    };
    let storage: { setTrackingStorage: jasmine.Spy };

    const buildExercise = (
        overrides: Partial<ExercisePerformanceVM> = {},
    ): ExercisePerformanceVM => ({
        exerciseId: 'ex-1',
        name: 'Squat',
        series: 3,
        category: ExerciseCategory.LEGS,
        sets: [{ reps: 10 }],
        usesWeight: true,
        ...overrides,
    });

    const buildWorkout = (overrides: Partial<WorkoutSessionVM> = {}): WorkoutSessionVM => ({
        id: 'ws-1',
        date: '2026-05-01',
        exercises: [buildExercise()],
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

    const buildDayVM = (overrides: Partial<WeekLogDayVM> = {}): WeekLogDayVM => ({
        order: 1,
        date: '2026-05-01',
        isRest: false,
        workoutSessionId: 'ws-1',
        exercises: [],
        extraSessionIds: [],
        status: 'complete',
        ...overrides,
    });

    beforeEach(() => {
        tracking = buildTracking();
        trackingSignal = signal<TrackingVM | null>(tracking);
        trackingSubject = new BehaviorSubject<TrackingVM | null>(tracking);
        dateService = { isSameLocalDate: (a, b) => a === b };

        domain = {
            initTracking: jasmine.createSpy('initTracking').and.returnValue(of(tracking)),
            createTracking: jasmine.createSpy('createTracking'),
            createWorkout: jasmine.createSpy('createWorkout'),
            createWorkoutWithRoutine: jasmine.createSpy('createWorkoutWithRoutine'),
            updateExercises: jasmine.createSpy('updateExercises').and.returnValue(of(null)),
            setRestDay: jasmine.createSpy('setRestDay'),
            removeExtraSession: jasmine.createSpy('removeExtraSession'),
            removeWorkoutSession: jasmine.createSpy('removeWorkoutSession'),
            updateWorkoutSession: jasmine.createSpy('updateWorkoutSession'),
            completeTracking: jasmine.createSpy('completeTracking'),
            createRoutineFromWorkout: jasmine.createSpy('createRoutineFromWorkout'),
        };

        state = {
            tracking: trackingSignal,
            tracking$: trackingSubject,
            loading: signal(false),
            loadingTracking: signal(false),
            loadingWorkoutCreation: signal({ date: '', state: false }),
            loadingStatusWorkout: signal(false),
            userId: signal(''),
            setTracking: jasmine
                .createSpy('setTracking')
                .and.callFake((next: TrackingVM | null) => {
                    tracking = next;
                    trackingSignal.set(next);
                    trackingSubject.next(next);
                }),
            getTrackingValue: jasmine.createSpy('getTrackingValue').and.callFake(() => tracking),
            updateWorkout: jasmine
                .createSpy('updateWorkout')
                .and.callFake(
                    (date: string, updater: (w: WorkoutSessionVM) => WorkoutSessionVM) => {
                        if (!tracking?.workouts) return;
                        tracking = {
                            ...tracking,
                            workouts: tracking.workouts.map((w) =>
                                dateService.isSameLocalDate(w.date, date) ? updater(w) : w,
                            ),
                        };
                        trackingSignal.set(tracking);
                        trackingSubject.next(tracking);
                    },
                ),
            setLoadingTracking: jasmine.createSpy('setLoadingTracking'),
            setLoadingStatusWorkout: jasmine.createSpy('setLoadingStatusWorkout'),
        };

        storage = { setTrackingStorage: jasmine.createSpy('setTrackingStorage') };

        TestBed.configureTestingModule({
            providers: [
                PlanTrackingService,
                { provide: PlanTrackingDomainService, useValue: domain },
                { provide: PlanTrackingStateService, useValue: state },
                { provide: PlanTrackingStorage, useValue: storage },
                { provide: DateService, useValue: dateService },
                {
                    provide: AuthService,
                    useValue: {
                        user$: new BehaviorSubject(null),
                        user: () => ({ id: 'user-1' }),
                    },
                },
            ],
        });

        service = TestBed.inject(PlanTrackingService);
    });

    describe('reloadTracking', () => {
        it('re-fetches, persists and returns the tracking while toggling the loading flag', () => {
            let result: TrackingVM | null | undefined;
            service.reloadTracking().subscribe((res) => (result = res));

            expect(state.userId()).toBe('user-1');
            expect(state.setLoadingTracking.calls.first().args).toEqual([true]);
            expect(state.setLoadingTracking.calls.mostRecent().args).toEqual([false]);
            expect(storage.setTrackingStorage).toHaveBeenCalledWith(tracking, 'user-1');
            expect(result).toEqual(tracking);
        });

        it('clears the tracking when the domain returns nothing', () => {
            domain.initTracking.and.returnValue(of(null));
            tracking = null;
            trackingSignal.set(null);

            let result: unknown;
            service.reloadTracking().subscribe((res) => (result = res));

            expect(state.setTracking).toHaveBeenCalledWith(null);
            expect(result).toBeNull();
        });
    });

    describe('setExercises', () => {
        it('optimistically updates the workout and persists it', () => {
            service.setExercises('2026-05-01', []);

            expect(tracking?.workouts?.[0].exercises).toEqual([]);
            expect(storage.setTrackingStorage).toHaveBeenCalled();
        });

        it('delegates to the domain only after the 4s debounce', fakeAsync(() => {
            const exercises = [buildExercise()];

            service.setExercises('2026-05-01', exercises);
            tick(3999);
            expect(domain.updateExercises).not.toHaveBeenCalled();

            tick(1);
            expect(domain.updateExercises).toHaveBeenCalledWith('2026-05-01', exercises);
        }));
    });

    describe('setRemoveAllExercises', () => {
        it('empties exercises and enqueues the debounced update', fakeAsync(() => {
            service.setRemoveAllExercises('2026-05-01');

            expect(tracking?.workouts?.[0].exercises).toEqual([]);

            tick(4000);
            expect(domain.updateExercises).toHaveBeenCalledWith('2026-05-01', []);
        }));
    });

    describe('setRestDay', () => {
        it('sends isRest=true and clears exercises locally for REST', () => {
            domain.setRestDay.and.returnValue(of(buildDayVM({ isRest: true })));

            service
                .setRestDay('2026-05-01', buildWorkout(), StatusWorkoutSessionEnum.REST)
                .subscribe();

            expect(domain.setRestDay).toHaveBeenCalledWith('2026-05-01', true);
            expect(tracking?.workouts?.[0].status).toBe(StatusWorkoutSessionEnum.REST);
            expect(tracking?.workouts?.[0].exercises).toEqual([]);
            expect(state.setLoadingStatusWorkout.calls.first().args).toEqual([true]);
            expect(state.setLoadingStatusWorkout.calls.mostRecent().args).toEqual([false]);
        });

        it('sends isRest=false for a non-rest status', () => {
            domain.setRestDay.and.returnValue(of(buildDayVM({ isRest: false })));

            service
                .setRestDay('2026-05-01', buildWorkout(), StatusWorkoutSessionEnum.NOT_STARTED)
                .subscribe();

            expect(domain.setRestDay).toHaveBeenCalledWith('2026-05-01', false);
            expect(tracking?.workouts?.[0].status).toBe(StatusWorkoutSessionEnum.NOT_STARTED);
        });
    });

    describe('updateWorkoutStatus', () => {
        it('updates the local cache only (EDITED is not persisted online)', () => {
            service.updateWorkoutStatus('2026-05-01', StatusWorkoutSessionEnum.EDITED);

            expect(tracking?.workouts?.[0].status).toBe(StatusWorkoutSessionEnum.EDITED);
            expect(domain.setRestDay).not.toHaveBeenCalled();
            expect(domain.updateWorkoutSession).not.toHaveBeenCalled();
            expect(storage.setTrackingStorage).toHaveBeenCalled();
        });
    });

    describe('removeWorkoutSession', () => {
        it('resets the local workout and reports success', () => {
            domain.removeWorkoutSession.and.returnValue(of(buildDayVM()));

            let result: boolean | undefined;
            service.removeWorkoutSession('2026-05-01', 'ws-1').subscribe((res) => (result = res));

            expect(result).toBe(true);
            expect(tracking?.workouts?.[0].id).toBeUndefined();
            expect(tracking?.workouts?.[0].exercises).toEqual([]);
            expect(tracking?.workouts?.[0].status).toBe(StatusWorkoutSessionEnum.NOT_STARTED);
        });

        it('reports false and keeps the workout when the domain returns nothing', () => {
            domain.removeWorkoutSession.and.returnValue(of(null));

            let result: boolean | undefined;
            service.removeWorkoutSession('2026-05-01', 'ws-1').subscribe((res) => (result = res));

            expect(result).toBe(false);
            expect(tracking?.workouts?.[0].id).toBe('ws-1');
        });
    });

    describe('updateWorkoutSession', () => {
        it('delegates and refreshes the local cache on finalize', () => {
            domain.updateWorkoutSession.and.returnValue(of(buildDayVM()));

            const updated = buildWorkout({
                exercises: [],
                status: StatusWorkoutSessionEnum.COMPLETE,
            });
            service.updateWorkoutSession('2026-05-01', updated);

            expect(domain.updateWorkoutSession).toHaveBeenCalledWith('2026-05-01', updated);
            expect(tracking?.workouts?.[0]).toEqual(updated);
        });
    });

    describe('delegating reads and commands', () => {
        it('getWorkout and getExercises read from tracking$', () => {
            let workout: WorkoutSessionVM | undefined;
            let exercises: ExercisePerformanceVM[] | undefined;

            service.getWorkout('2026-05-01').subscribe((w) => (workout = w));
            service.getExercises('2026-05-01').subscribe((e) => (exercises = e));

            expect(workout?.id).toBe('ws-1');
            expect(exercises?.length).toBe(1);
        });

        it('completeTracking and createTracking delegate to the domain', () => {
            const completed: TrackingVMS = { ...buildTracking(), days: [], completed: true };
            domain.completeTracking.and.returnValue(of(completed));
            domain.createTracking.and.returnValue(of(tracking));

            let completedResult: TrackingVMS | null | undefined;
            service.completeTracking(true).subscribe((res) => (completedResult = res));

            let createdResult: TrackingVM | null | undefined;
            service.createTracking('plan-1').subscribe((res) => (createdResult = res));

            expect(domain.completeTracking).toHaveBeenCalledWith(true);
            expect(domain.createTracking).toHaveBeenCalledWith('plan-1');
            expect(completedResult).toEqual(completed);
            expect(createdResult).toEqual(tracking);
        });
    });
});
