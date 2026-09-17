import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Apollo } from 'apollo-angular';

import { WorkoutInProgress } from './workout-in-progress';
import { apolloMock } from '../../../../../../core/testing/apollo.mock';
import { workoutStoreMock } from '../../../../../../core/testing/workout-store.mock';
import { WORKOUT_STORE } from '../../../../../../core/services/workouts/workout-store.interface';
import { TrackingWorkoutFacade } from '../tracking-workout.facade';

describe('WorkoutInProgress', () => {
    let component: WorkoutInProgress;
    let fixture: ComponentFixture<WorkoutInProgress>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [WorkoutInProgress],
            providers: [
                { provide: Apollo, useValue: apolloMock },
                { provide: WORKOUT_STORE, useValue: workoutStoreMock },
                TrackingWorkoutFacade,
                provideNoopAnimations(),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(WorkoutInProgress);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
