import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Apollo } from 'apollo-angular';

import { TrackingWorkoutComponent } from './tracking-workout';
import { TrackingWorkoutFacade } from './tracking-workout.facade';
import { WorkoutEdition } from './workout-edition/workout-edition';
import { ExtraSessionForm } from '../../extra-session/extra-session-form/extra-session-form';
import { WorkoutSessionVM } from '../../../../interfaces/tracking.interface';
import { apolloMock } from '../../../../../core/testing/apollo.mock';
import { workoutStoreMock } from '../../../../../core/testing/workout-store.mock';
import { WORKOUT_STORE } from '../../../../../core/services/workouts/workout-store.interface';

describe('TrackingWorkout', () => {
    let component: TrackingWorkoutComponent;
    let fixture: ComponentFixture<TrackingWorkoutComponent>;
    let facade: {
        activeLoading: ReturnType<typeof signal<boolean>>;
        loadings: ReturnType<typeof signal<boolean>>;
        workoutVM: ReturnType<typeof signal<WorkoutSessionVM>>;
        loadingStatusWorkout: ReturnType<typeof signal<boolean>>;
        exercisesSelected: ReturnType<typeof signal<any[]>>;
        showExtraSessionDialog: ReturnType<typeof signal<boolean>>;
        updateWorkoutSession: jasmine.Spy;
        createExtraSession: jasmine.Spy;
    };

    const editedWorkout: WorkoutSessionVM = {
        id: 'ws-1',
        date: '2026-10-15',
        exercises: [],
        status: 'edited',
    };

    beforeEach(async () => {
        facade = {
            activeLoading: signal(false),
            loadings: signal(false),
            workoutVM: signal(editedWorkout),
            loadingStatusWorkout: signal(false),
            exercisesSelected: signal([]),
            showExtraSessionDialog: signal(false),
            updateWorkoutSession: jasmine.createSpy('updateWorkoutSession'),
            createExtraSession: jasmine.createSpy('createExtraSession'),
        };

        await TestBed.configureTestingModule({
            imports: [TrackingWorkoutComponent],
            providers: [
                provideNoopAnimations(),
                { provide: Apollo, useValue: apolloMock },
                { provide: WORKOUT_STORE, useValue: workoutStoreMock },
            ],
        })
            .overrideComponent(TrackingWorkoutComponent, {
                set: { providers: [{ provide: TrackingWorkoutFacade, useValue: facade }] },
            })
            .compileComponents();

        fixture = TestBed.createComponent(TrackingWorkoutComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('persists an edited workout when WorkoutEdition emits saveWorkoutSession', () => {
        const edition = fixture.debugElement.query(By.directive(WorkoutEdition));
        expect(edition).toBeTruthy();

        const saved: WorkoutSessionVM = {
            ...editedWorkout,
            status: 'complete',
            exercises: [
                {
                    exerciseId: 'ex-1',
                    name: 'Bench Press',
                    category: 'CHEST' as any,
                    series: 2,
                    sets: [{ reps: 10, weights: 60 }],
                    usesWeight: true,
                },
            ],
        };

        edition.componentInstance.saveWorkoutSession.emit(saved);

        expect(facade.updateWorkoutSession).toHaveBeenCalledOnceWith(saved);
    });

    it('routes saveExtraSession from the shared form to the active create path', () => {
        facade.workoutVM.set({ ...editedWorkout, status: 'complete' });
        fixture.detectChanges();

        const form = fixture.debugElement.query(By.directive(ExtraSessionForm));
        expect(form).toBeTruthy();

        const payload = { discipline: 'running', duration: 30, intensityLevel: 3 };
        form.componentInstance.saveExtraSession.emit(payload as any);

        expect(facade.createExtraSession).toHaveBeenCalledOnceWith(payload as any);
    });
});
