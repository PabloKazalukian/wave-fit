import { signal, Signal } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { DayLogVM } from '../../../shared/interfaces/day-log.interface';
import { CreateExtraSessionForm } from '../../../shared/interfaces/extra-session.interface';
import { ExerciseCategory } from '../../../shared/interfaces/exercise.interface';
import {
    ExercisePerformanceVM,
    StatusWorkoutSessionEnum,
    WorkoutSessionVM,
} from '../../../shared/interfaces/tracking.interface';
import { AuthService } from '../auth/auth.service';
import { PlanDayDomainService } from './plan-day.domain';
import { PlanDayService } from './plan-day.service';
import { PlanDayStateService } from './plan-day.state';
import { PlanDayStorage } from './plan-day/storage/plan-day.storage';

describe('PlanDayService', () => {
    let service: PlanDayService;
    let dayLog$: BehaviorSubject<DayLogVM | null>;
    let domain: {
        createDayLog: jasmine.Spy;
        createWorkout: jasmine.Spy;
        createWorkoutWithRoutine: jasmine.Spy;
        setRestDay: jasmine.Spy;
        updateExercises: jasmine.Spy;
        updateWorkoutSession: jasmine.Spy;
        completeDayLog: jasmine.Spy;
        removeWorkoutSession: jasmine.Spy;
        removeExtraSession: jasmine.Spy;
        updateExtraSession: jasmine.Spy;
        initActiveLog: jasmine.Spy;
        initDayLog: jasmine.Spy;
    };
    let state: {
        dayLog$: Observable<DayLogVM | null>;
        loading: Signal<boolean>;
        loadingDayLog: Signal<boolean>;
        loadingWorkoutCreation: Signal<{ date: string; state: boolean }>;
        loadingStatusWorkout: Signal<boolean>;
        userId: ReturnType<typeof signal<string>>;
        setDayLog: jasmine.Spy;
        updateDayLog: jasmine.Spy;
        getDayLogValue: jasmine.Spy;
        setLoadingDayLog: jasmine.Spy;
        setLoadingStatusWorkout: jasmine.Spy;
    };
    let storage: { setDayLogStorage: jasmine.Spy };
    let auth: { user$: Observable<string | null>; user: jasmine.Spy };

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

    const exercise: ExercisePerformanceVM = {
        exerciseId: 'ex-1',
        name: 'Press banca',
        series: 3,
        category: ExerciseCategory.CHEST,
        sets: [{ reps: 10, weights: 50 }],
        usesWeight: true,
    };

    const workout: WorkoutSessionVM = {
        id: 'ws-1',
        date: '2026-05-01',
        exercises: [exercise],
        status: StatusWorkoutSessionEnum.COMPLETE,
    };

    const extraSessionForm: CreateExtraSessionForm = {
        date: '2026-05-01',
        discipline: 'running',
        duration: 30,
        intensityLevel: 3,
    };

    beforeEach(() => {
        dayLog$ = new BehaviorSubject<DayLogVM | null>(null);

        domain = {
            createDayLog: jasmine.createSpy('createDayLog'),
            createWorkout: jasmine.createSpy('createWorkout'),
            createWorkoutWithRoutine: jasmine.createSpy('createWorkoutWithRoutine'),
            setRestDay: jasmine.createSpy('setRestDay'),
            updateExercises: jasmine.createSpy('updateExercises'),
            updateWorkoutSession: jasmine.createSpy('updateWorkoutSession'),
            completeDayLog: jasmine.createSpy('completeDayLog'),
            removeWorkoutSession: jasmine.createSpy('removeWorkoutSession'),
            removeExtraSession: jasmine.createSpy('removeExtraSession'),
            updateExtraSession: jasmine.createSpy('updateExtraSession'),
            initActiveLog: jasmine.createSpy('initActiveLog').and.returnValue(of({})),
            initDayLog: jasmine.createSpy('initDayLog'),
        };

        state = {
            dayLog$: dayLog$.asObservable(),
            loading: signal(false),
            loadingDayLog: signal(false),
            loadingWorkoutCreation: signal({ date: '', state: false }),
            loadingStatusWorkout: signal(false),
            userId: signal(''),
            setDayLog: jasmine.createSpy('setDayLog'),
            updateDayLog: jasmine.createSpy('updateDayLog'),
            getDayLogValue: jasmine.createSpy('getDayLogValue').and.returnValue(null),
            setLoadingDayLog: jasmine.createSpy('setLoadingDayLog'),
            setLoadingStatusWorkout: jasmine.createSpy('setLoadingStatusWorkout'),
        };

        storage = { setDayLogStorage: jasmine.createSpy('setDayLogStorage') };
        auth = {
            user$: new BehaviorSubject<string | null>(null),
            user: jasmine.createSpy('user').and.returnValue(null),
        };

        TestBed.configureTestingModule({
            providers: [
                PlanDayService,
                { provide: PlanDayDomainService, useValue: domain },
                { provide: PlanDayStateService, useValue: state },
                { provide: PlanDayStorage, useValue: storage },
                { provide: AuthService, useValue: auth },
            ],
        });

        service = TestBed.inject(PlanDayService);
    });

    it('createDayLog delegates and persists the returned day-log', () => {
        const day = buildDayLog();
        domain.createDayLog.and.returnValue(of(day));

        let result: DayLogVM | null | undefined;
        service.createDayLog('plan-1', '2026-05-01', 'rd-1').subscribe((res) => (result = res));

        expect(domain.createDayLog).toHaveBeenCalledWith('plan-1', '2026-05-01', 'rd-1');
        expect(state.setDayLog).toHaveBeenCalledWith(day);
        expect(storage.setDayLogStorage).toHaveBeenCalledWith(day, day.userId);
        expect(result).toEqual(day);
    });

    it('createWorkout delegates and persists the returned day-log', () => {
        const day = buildDayLog({ status: 'complete' });
        domain.createWorkout.and.returnValue(of(day));

        service.createWorkout('2026-05-01').subscribe();

        expect(domain.createWorkout).toHaveBeenCalledWith('2026-05-01');
        expect(state.setDayLog).toHaveBeenCalledWith(day);
        expect(storage.setDayLogStorage).toHaveBeenCalledWith(day, day.userId);
    });

    it('createWorkoutWithRoutine delegates and persists the returned day-log', () => {
        const day = buildDayLog({ routineDayId: 'rd-1' });
        domain.createWorkoutWithRoutine.and.returnValue(of(day));

        service.createWorkoutWithRoutine('rd-1', '2026-05-01').subscribe();

        expect(domain.createWorkoutWithRoutine).toHaveBeenCalledWith('rd-1', '2026-05-01');
        expect(state.setDayLog).toHaveBeenCalledWith(day);
    });

    it('setRestDay toggles the status loading flag and persists the result', () => {
        const day = buildDayLog({ status: 'skipped' });
        domain.setRestDay.and.returnValue(of(day));

        service.setRestDay('2026-05-01', true).subscribe();

        expect(domain.setRestDay).toHaveBeenCalledWith('2026-05-01', true);
        expect(state.setLoadingStatusWorkout.calls.first().args).toEqual([true]);
        expect(state.setLoadingStatusWorkout.calls.mostRecent().args).toEqual([false]);
        expect(state.setDayLog).toHaveBeenCalledWith(day);
    });

    it('removeWorkoutSession toggles the status loading flag', () => {
        domain.removeWorkoutSession.and.returnValue(of(buildDayLog()));

        service.removeWorkoutSession('ws-1').subscribe();

        expect(domain.removeWorkoutSession).toHaveBeenCalledWith('ws-1');
        expect(state.setLoadingStatusWorkout.calls.first().args).toEqual([true]);
        expect(state.setLoadingStatusWorkout.calls.mostRecent().args).toEqual([false]);
    });

    it('updateExtraSession and removeExtraSession persist the result', () => {
        const day = buildDayLog();
        domain.updateExtraSession.and.returnValue(of(day));
        domain.removeExtraSession.and.returnValue(of(day));

        service.updateExtraSession(extraSessionForm).subscribe();
        service.removeExtraSession('x-1').subscribe();

        expect(state.setDayLog).toHaveBeenCalledTimes(2);
    });

    it('setExercises updates the container optimistically and persists after the debounce', fakeAsync(() => {
        const day = buildDayLog();
        state.getDayLogValue.and.returnValue(day);
        domain.updateExercises.and.returnValue(of(day));

        service.setExercises([exercise]);

        expect(state.updateDayLog).toHaveBeenCalledTimes(1);
        expect(domain.updateExercises).not.toHaveBeenCalled();

        tick(4000);

        expect(domain.updateExercises).toHaveBeenCalledWith([exercise]);
    }));

    it('updateWorkoutSession delegates and refreshes the day exercises', () => {
        const day = buildDayLog();
        state.getDayLogValue.and.returnValue(day);
        domain.updateWorkoutSession.and.returnValue(of({ ...workout, exercises: [exercise] }));

        service.updateWorkoutSession(workout);

        expect(domain.updateWorkoutSession).toHaveBeenCalledWith(workout);
        expect(state.updateDayLog).toHaveBeenCalledTimes(1);
    });

    it('getWorkout maps the day status to the workout status', () => {
        const statuses: [DayLogVM['status'], StatusWorkoutSessionEnum][] = [
            ['skipped', StatusWorkoutSessionEnum.REST],
            ['complete', StatusWorkoutSessionEnum.COMPLETE],
            ['pending', StatusWorkoutSessionEnum.NOT_STARTED],
        ];

        statuses.forEach(([dayStatus, expected]) => {
            dayLog$.next(buildDayLog({ status: dayStatus, exercises: [exercise] }));
            let result: WorkoutSessionVM | undefined;
            service.getWorkout().subscribe((res) => (result = res));
            expect(result?.status).toBe(expected);
            expect(result?.exercises).toEqual([exercise]);
        });
    });

    it('completeDayLog delegates to the domain', () => {
        domain.completeDayLog.and.returnValue(of(buildDayLog({ completed: true, active: false })));

        service.completeDayLog(true).subscribe();

        expect(domain.completeDayLog).toHaveBeenCalledWith(true);
    });

    it('reloadDayLog uses the authenticated user id and toggles the loading flag', () => {
        auth.user.and.returnValue({ id: 'user-9' });
        domain.initDayLog.and.returnValue(of(buildDayLog({ userId: 'user-9' })));

        service.reloadDayLog().subscribe();

        expect(state.userId()).toBe('user-9');
        expect(state.setLoadingDayLog.calls.first().args).toEqual([true]);
        expect(state.setLoadingDayLog.calls.mostRecent().args).toEqual([false]);
    });
});
