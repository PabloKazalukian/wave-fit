import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { TrackingWorkoutFacade } from './tracking-workout.facade';
import { ActiveTrackingService } from '../../../../../core/services/trackings/active-tracking.service';
import { ExercisesService } from '../../../../../core/services/exercises/exercises.service';
import { WORKOUT_STORE } from '../../../../../core/services/workouts/workout-store.interface';
import { ExtraSessionService } from '../../../../../core/services/extra-session/extra-session.service';
import {
    StatusWorkoutSessionEnum,
    WorkoutSessionVM,
} from '../../../../interfaces/tracking.interface';
import { ExtraSessionFormValue } from '../../../../interfaces/extra-session.interface';

describe('TrackingWorkoutFacade save feedback', () => {
    let facade: TrackingWorkoutFacade;
    let extraSessionSvc: {
        create: jasmine.Spy;
        toCreateInput: jasmine.Spy;
    };
    let store: {
        selectedDate: ReturnType<typeof signal<string | null>>;
        workoutSession: ReturnType<typeof signal<WorkoutSessionVM | null>>;
        exercises: ReturnType<typeof signal<unknown[]>>;
        loadingWorkoutCreation: ReturnType<typeof signal<{ date: string; state: boolean }>>;
        loadingStatusWorkout: ReturnType<typeof signal<boolean>>;
        loading: ReturnType<typeof signal<boolean>>;
        updateWorkoutSession: jasmine.Spy;
    };

    const workout: WorkoutSessionVM = {
        id: 'ws-1',
        date: '2026-05-01',
        exercises: [],
        status: StatusWorkoutSessionEnum.COMPLETE,
    };

    beforeEach(() => {
        extraSessionSvc = {
            create: jasmine.createSpy('create').and.returnValue(of(null)),
            toCreateInput: jasmine
                .createSpy('toCreateInput')
                .and.callFake((v: ExtraSessionFormValue) => ({
                    date: '2026-05-01',
                    discipline: v.discipline,
                    duration: v.duration,
                    intensityLevel: v.intensityLevel,
                    calories: v.calories,
                    notes: v.notes,
                })),
        };

        store = {
            selectedDate: signal<string | null>('2026-05-01'),
            workoutSession: signal<WorkoutSessionVM | null>(workout),
            exercises: signal<unknown[]>([]),
            loadingWorkoutCreation: signal({ date: '', state: false }),
            loadingStatusWorkout: signal(false),
            loading: signal(false),
            updateWorkoutSession: jasmine
                .createSpy('updateWorkoutSession')
                .and.returnValue(of(workout)),
        };

        TestBed.configureTestingModule({
            providers: [
                TrackingWorkoutFacade,
                { provide: WORKOUT_STORE, useValue: store },
                {
                    provide: ActiveTrackingService,
                    useValue: {
                        loading: signal(false),
                        ready: signal(true),
                        isDayLogActive: signal(false),
                    },
                },
                { provide: ExercisesService, useValue: {} },
                { provide: ExtraSessionService, useValue: extraSessionSvc },
            ],
        });

        facade = TestBed.inject(TrackingWorkoutFacade);
    });

    it('exposes a success result after the store save completes', () => {
        facade.saveError.set('old error');

        facade.updateWorkoutSession(workout);

        expect(store.updateWorkoutSession).toHaveBeenCalledWith('2026-05-01', workout);
        expect(facade.saveError()).toBeNull();
        expect(facade.saveSuccess()).toBeTrue();
    });

    it('exposes a visible error and no success when the store save fails', () => {
        store.updateWorkoutSession.and.returnValue(throwError(() => new Error('network')));

        facade.updateWorkoutSession(workout);

        expect(facade.saveSuccess()).toBeFalse();
        expect(facade.saveError()).toContain('No se pudo guardar');
    });

    const formValue: ExtraSessionFormValue = {
        category: 'Cardio',
        discipline: 'running',
        workoutSessionId: '',
        date: new Date('2026-05-01T00:00:00Z'),
        duration: 30,
        intensityLevel: 3,
        calories: 100,
        notes: 'Salí a correr',
    };

    it('creates the extra session through the service and closes the dialog on success', () => {
        facade.showExtraSessionDialog.set(true);

        facade.createExtraSession(formValue);

        expect(extraSessionSvc.create).toHaveBeenCalledWith(
            jasmine.objectContaining({ discipline: 'running', duration: 30 }),
        );
        expect(facade.showExtraSessionDialog()).toBeFalse();
        expect(facade.saveSuccess()).toBeTrue();
    });

    it('reports an error and keeps the dialog open when extra-session creation fails', () => {
        extraSessionSvc.create.and.returnValue(throwError(() => new Error('network')));
        facade.showExtraSessionDialog.set(true);

        facade.createExtraSession(formValue);

        expect(facade.showExtraSessionDialog()).toBeTrue();
        expect(facade.saveError()).toContain('No se pudo guardar la actividad extra');
    });
});
