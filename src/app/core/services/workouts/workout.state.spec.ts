import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';
import { ExerciseCategory } from '../../../shared/interfaces/exercise.interface';
import {
    ExercisePerformanceVM,
    StatusWorkoutSession,
    StatusWorkoutSessionEnum,
    TrackingVM,
    WorkoutSessionVM,
} from '../../../shared/interfaces/tracking.interface';
import { DateService } from '../date.service';
import { PlanTrackingService } from '../trackings/plan-tracking.service';
import { WorkoutStateService } from './workout.state';

describe('WorkoutStateService (TEST-006)', () => {
    let service: WorkoutStateService;
    let trackingPlan$: BehaviorSubject<TrackingVM | null>;
    let trackingSvc: {
        trackingPlanVM$: BehaviorSubject<TrackingVM | null>;
        loadingWorkoutCreation: WritableSignal<{ date: string; state: boolean }>;
        loadingStatusWorkout: WritableSignal<boolean>;
        loading: WritableSignal<boolean>;
        getWorkout: jasmine.Spy;
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
        ...overrides,
    });

    beforeEach(() => {
        trackingPlan$ = new BehaviorSubject<TrackingVM | null>(buildTracking());

        trackingSvc = {
            trackingPlanVM$: trackingPlan$,
            loadingWorkoutCreation: signal({ date: '', state: false }),
            loadingStatusWorkout: signal(false),
            loading: signal(false),
            getWorkout: jasmine.createSpy('getWorkout').and.returnValue(of(buildWorkout())),
            setExercises: jasmine.createSpy('setExercises'),
            createWorkout: jasmine.createSpy('createWorkout').and.returnValue(of(buildWorkout())),
            setRestDay: jasmine.createSpy('setRestDay').and.returnValue(of(null)),
            setRemoveAllExercises: jasmine.createSpy('setRemoveAllExercises'),
            updateWorkoutStatus: jasmine.createSpy('updateWorkoutStatus'),
            updateWorkoutSession: jasmine.createSpy('updateWorkoutSession'),
            removeWorkoutSession: jasmine
                .createSpy('removeWorkoutSession')
                .and.returnValue(of(true)),
            createWorkoutWithRoutine: jasmine
                .createSpy('createWorkoutWithRoutine')
                .and.returnValue(of(null)),
            createRoutineFromWorkout: jasmine
                .createSpy('createRoutineFromWorkout')
                .and.returnValue(of(null)),
        };

        TestBed.configureTestingModule({
            providers: [
                WorkoutStateService,
                { provide: PlanTrackingService, useValue: trackingSvc },
                { provide: DateService, useValue: { todayLocalDate: () => '2026-05-01' } },
            ],
        });

        service = TestBed.inject(WorkoutStateService);
    });

    it('exposes the WorkoutStore contract surface', () => {
        expect(service.selectedDate()).toBeNull();
        expect(service.workoutSession()).toBeNull();
        expect(service.exercises()).toEqual([]);
        expect(service.outOfDateRange()).toBe(false);
        expect(service.loadingWorkoutCreation).toBe(trackingSvc.loadingWorkoutCreation);
        expect(service.loadingStatusWorkout).toBe(trackingSvc.loadingStatusWorkout);
        expect(service.loading).toBe(trackingSvc.loading);

        [
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
        ].forEach((method) => {
            expect(typeof (service as unknown as Record<string, unknown>)[method]).toBe('function');
        });
    });

    describe('setDate', () => {
        it('sets the selected date and loads the matching workout', () => {
            service.setDate('2026-05-01');

            expect(service.selectedDate()).toBe('2026-05-01');
            expect(trackingSvc.getWorkout).toHaveBeenCalledWith('2026-05-01');
            expect(service.workoutSession()?.id).toBe('ws-1');
        });

        it('keeps the previous workout when the date has no session', () => {
            service.setDate('2026-05-01');
            trackingSvc.getWorkout.and.returnValue(of(undefined));

            service.setDate('2026-05-02');

            expect(service.selectedDate()).toBe('2026-05-02');
            expect(service.workoutSession()?.id).toBe('ws-1');
        });
    });

    describe('updateExercises', () => {
        it('delegates to the tracking service and updates the local session', () => {
            service.setDate('2026-05-01');
            const exercises = [buildExercise({ exerciseId: 'ex-2' })];

            service.updateExercises(exercises);

            expect(trackingSvc.setExercises).toHaveBeenCalledWith('2026-05-01', exercises);
            expect(service.workoutSession()?.exercises).toEqual(exercises);
        });

        it('does nothing when no date is selected', () => {
            service.updateExercises([buildExercise()]);

            expect(trackingSvc.setExercises).not.toHaveBeenCalled();
        });
    });

    it('derives exercises from the current workout session', () => {
        service.setDate('2026-05-01');

        expect(service.exercises().length).toBe(1);
        expect(service.exercises()[0].exerciseId).toBe('ex-1');
    });

    describe('delegation to PlanTrackingService', () => {
        it('forwards the day-level commands', () => {
            const workout = buildWorkout();
            const status: StatusWorkoutSession = StatusWorkoutSessionEnum.REST;

            service.createWorkout('2026-05-01');
            service.setRestDay('2026-05-01', workout, status);
            service.setRemoveAllExercises('2026-05-01');
            service.updateWorkoutStatus('2026-05-01', StatusWorkoutSessionEnum.EDITED);
            service.updateWorkoutSession('2026-05-01', workout);
            service.removeWorkoutSession('2026-05-01', 'ws-1');
            service.createWorkoutWithRoutine('rd-1', '2026-05-01');
            service.createRoutineFromWorkout('Title', ['ex-1']);

            expect(trackingSvc.createWorkout).toHaveBeenCalledWith('2026-05-01');
            expect(trackingSvc.setRestDay).toHaveBeenCalledWith('2026-05-01', workout, status);
            expect(trackingSvc.setRemoveAllExercises).toHaveBeenCalledWith('2026-05-01');
            expect(trackingSvc.updateWorkoutStatus).toHaveBeenCalledWith(
                '2026-05-01',
                StatusWorkoutSessionEnum.EDITED,
            );
            expect(trackingSvc.updateWorkoutSession).toHaveBeenCalledWith('2026-05-01', workout);
            expect(trackingSvc.removeWorkoutSession).toHaveBeenCalledWith('2026-05-01', 'ws-1');
            expect(trackingSvc.createWorkoutWithRoutine).toHaveBeenCalledWith('rd-1', '2026-05-01');
            expect(trackingSvc.createRoutineFromWorkout).toHaveBeenCalledWith('Title', ['ex-1']);
        });
    });
});
