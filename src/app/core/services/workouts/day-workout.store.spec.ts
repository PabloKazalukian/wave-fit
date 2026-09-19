import { signal, Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';
import { DayLogVM } from '../../../shared/interfaces/day-log.interface';
import { ExerciseCategory } from '../../../shared/interfaces/exercise.interface';
import {
    ExercisePerformanceVM,
    StatusWorkoutSessionEnum,
    WorkoutSessionVM,
} from '../../../shared/interfaces/tracking.interface';
import { PlanDayService } from '../day-logs/plan-day.service';
import { DayWorkoutStore } from './day-workout.store';
import { WorkoutStore } from './workout-store.interface';

describe('DayWorkoutStore', () => {
    let store: DayWorkoutStore;
    let dayLog$: BehaviorSubject<DayLogVM | null>;
    let planDaySvc: {
        dayLog$: BehaviorSubject<DayLogVM | null>;
        loading: Signal<boolean>;
        loadingWorkoutCreation: Signal<{ date: string; state: boolean }>;
        loadingStatusWorkout: Signal<boolean>;
        setExercises: jasmine.Spy;
        createWorkout: jasmine.Spy;
        setRestDay: jasmine.Spy;
        setRemoveAllExercises: jasmine.Spy;
        updateWorkoutStatus: jasmine.Spy;
        updateWorkoutSession: jasmine.Spy;
        removeWorkoutSession: jasmine.Spy;
        createWorkoutWithRoutine: jasmine.Spy;
        createRoutineFromWorkout: jasmine.Spy;
    };

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

    beforeEach(() => {
        dayLog$ = new BehaviorSubject<DayLogVM | null>(buildDayLog());

        planDaySvc = {
            dayLog$,
            loading: signal(false),
            loadingWorkoutCreation: signal({ date: '', state: false }),
            loadingStatusWorkout: signal(false),
            setExercises: jasmine.createSpy('setExercises'),
            createWorkout: jasmine.createSpy('createWorkout').and.returnValue(of(buildDayLog())),
            setRestDay: jasmine.createSpy('setRestDay').and.returnValue(of(buildDayLog())),
            setRemoveAllExercises: jasmine.createSpy('setRemoveAllExercises'),
            updateWorkoutStatus: jasmine.createSpy('updateWorkoutStatus'),
            updateWorkoutSession: jasmine.createSpy('updateWorkoutSession'),
            removeWorkoutSession: jasmine
                .createSpy('removeWorkoutSession')
                .and.returnValue(of(buildDayLog())),
            createWorkoutWithRoutine: jasmine
                .createSpy('createWorkoutWithRoutine')
                .and.returnValue(of(buildDayLog())),
            createRoutineFromWorkout: jasmine
                .createSpy('createRoutineFromWorkout')
                .and.returnValue(of(null)),
        };

        TestBed.configureTestingModule({
            providers: [DayWorkoutStore, { provide: PlanDayService, useValue: planDaySvc }],
        });

        store = TestBed.inject(DayWorkoutStore);
    });

    it('satisfies the WorkoutStore contract (TEST-006)', () => {
        const contract: WorkoutStore = store;
        expect(contract).toBeTruthy();

        const signals: (keyof WorkoutStore)[] = [
            'selectedDate',
            'workoutSession',
            'exercises',
            'outOfDateRange',
            'loadingWorkoutCreation',
            'loadingStatusWorkout',
            'loading',
        ];
        const methods: (keyof WorkoutStore)[] = [
            'setDate',
            'updateExercises',
            'createWorkout',
            'setRestDay',
            'setRemoveAllExercises',
            'updateWorkoutStatus',
            'updateWorkoutSession',
            'removeWorkoutSession',
            'createWorkoutWithRoutine',
            'createRoutineFromWorkout',
        ];

        signals.forEach((key) => expect(signals.includes(key)).toBe(true));
        methods.forEach((key) => expect(typeof store[key]).toBe('function'));
    });

    it('exposes the selected date from the active day-log', () => {
        expect(store.selectedDate()).toBe('2026-05-01');

        dayLog$.next(buildDayLog({ date: '2026-06-01' }));

        expect(store.selectedDate()).toBe('2026-06-01');
    });

    it('builds the workout session from the flat day-log', () => {
        dayLog$.next(
            buildDayLog({
                workoutSessionId: 'ws-1',
                exercises: [exercise],
                extraSessionIds: ['x-1'],
            }),
        );

        expect(store.workoutSession()).toEqual({
            id: 'ws-1',
            date: '2026-05-01',
            exercises: [exercise],
            extras: ['x-1'],
            status: StatusWorkoutSessionEnum.NOT_STARTED,
        });
    });

    it('maps the day status to the workout status', () => {
        dayLog$.next(buildDayLog({ status: 'complete' }));
        expect(store.workoutSession()?.status).toBe(StatusWorkoutSessionEnum.COMPLETE);

        dayLog$.next(buildDayLog({ status: 'skipped' }));
        expect(store.workoutSession()?.status).toBe(StatusWorkoutSessionEnum.REST);

        dayLog$.next(buildDayLog({ status: 'pending' }));
        expect(store.workoutSession()?.status).toBe(StatusWorkoutSessionEnum.NOT_STARTED);
    });

    it('exposes the day exercises', () => {
        dayLog$.next(buildDayLog({ exercises: [exercise] }));
        expect(store.exercises()).toEqual([exercise]);
    });

    it('passes the loading signals through', () => {
        expect(store.loading()).toBe(false);
        expect(store.loadingStatusWorkout()).toBe(false);

        (planDaySvc.loading as ReturnType<typeof signal<boolean>>).set(true);

        expect(store.loading()).toBe(true);
    });

    it('createWorkout delegates and maps the returned day-log to a workout', () => {
        planDaySvc.createWorkout.and.returnValue(
            of(buildDayLog({ workoutSessionId: 'ws-2', status: 'complete' })),
        );

        let result: WorkoutSessionVM | null | undefined;
        store.createWorkout('2026-05-01').subscribe((res) => (result = res as WorkoutSessionVM));

        expect(planDaySvc.createWorkout).toHaveBeenCalledWith('2026-05-01');
        expect(result?.id).toBe('ws-2');
        expect(result?.status).toBe(StatusWorkoutSessionEnum.COMPLETE);
    });

    it('setRestDay maps the workout status to isRest', () => {
        store.setRestDay('2026-05-01', workout, StatusWorkoutSessionEnum.REST).subscribe();
        expect(planDaySvc.setRestDay).toHaveBeenCalledWith('2026-05-01', true);

        store.setRestDay('2026-05-01', workout, StatusWorkoutSessionEnum.COMPLETE).subscribe();
        expect(planDaySvc.setRestDay).toHaveBeenCalledWith('2026-05-01', false);
    });

    it('setRemoveAllExercises delegates to the facade', () => {
        store.setRemoveAllExercises('2026-05-01');
        expect(planDaySvc.setRemoveAllExercises).toHaveBeenCalledTimes(1);
    });

    it('updateExercises delegates to the facade', () => {
        store.updateExercises([exercise]);
        expect(planDaySvc.setExercises).toHaveBeenCalledWith([exercise]);
    });

    it('updateWorkoutStatus maps the workout status to the day status', () => {
        store.updateWorkoutStatus('2026-05-01', StatusWorkoutSessionEnum.COMPLETE);
        expect(planDaySvc.updateWorkoutStatus).toHaveBeenCalledWith('complete');

        store.updateWorkoutStatus('2026-05-01', StatusWorkoutSessionEnum.REST);
        expect(planDaySvc.updateWorkoutStatus).toHaveBeenCalledWith('skipped');

        store.updateWorkoutStatus('2026-05-01', StatusWorkoutSessionEnum.NOT_STARTED);
        expect(planDaySvc.updateWorkoutStatus).toHaveBeenCalledWith('pending');

        store.updateWorkoutStatus('2026-05-01', StatusWorkoutSessionEnum.EDITED);
        expect(planDaySvc.updateWorkoutStatus).toHaveBeenCalledWith('pending');
    });

    it('updateWorkoutSession delegates to the facade', () => {
        store.updateWorkoutSession('2026-05-01', workout);
        expect(planDaySvc.updateWorkoutSession).toHaveBeenCalledWith(workout);
    });

    it('removeWorkoutSession maps the result to a boolean', () => {
        let result: boolean | undefined;
        store.removeWorkoutSession('2026-05-01', 'ws-1').subscribe((res) => (result = res));
        expect(planDaySvc.removeWorkoutSession).toHaveBeenCalledWith('ws-1');
        expect(result).toBe(true);

        planDaySvc.removeWorkoutSession.and.returnValue(of(null));
        store.removeWorkoutSession('2026-05-01', 'ws-1').subscribe((res) => (result = res));
        expect(result).toBe(false);
    });

    it('createWorkoutWithRoutine delegates and maps the returned day-log', () => {
        planDaySvc.createWorkoutWithRoutine.and.returnValue(
            of(buildDayLog({ workoutSessionId: 'ws-3' })),
        );

        let result: WorkoutSessionVM | null | undefined;
        store
            .createWorkoutWithRoutine('rd-1', '2026-05-01')
            .subscribe((res) => (result = res as WorkoutSessionVM));

        expect(planDaySvc.createWorkoutWithRoutine).toHaveBeenCalledWith('rd-1', '2026-05-01');
        expect(result?.id).toBe('ws-3');
    });

    it('createRoutineFromWorkout delegates to the facade', () => {
        store.createRoutineFromWorkout('t', ['ex-1']);
        expect(planDaySvc.createRoutineFromWorkout).toHaveBeenCalledWith('t', ['ex-1']);
    });

    it('setDate keeps the range flag in-range', () => {
        store.setDate('2026-05-01');
        expect(store.outOfDateRange()).toBe(false);
    });
});
