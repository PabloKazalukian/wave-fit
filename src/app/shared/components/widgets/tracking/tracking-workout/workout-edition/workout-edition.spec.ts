import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Apollo } from 'apollo-angular';

import { WorkoutEdition } from './workout-edition';
import { apolloMock } from '../../../../../../core/testing/apollo.mock';
import { workoutStoreMock } from '../../../../../../core/testing/workout-store.mock';
import { WORKOUT_STORE } from '../../../../../../core/services/workouts/workout-store.interface';
import { TrackingWorkoutFacade } from '../tracking-workout.facade';

describe('WorkoutEdition', () => {
    let component: WorkoutEdition;
    let fixture: ComponentFixture<WorkoutEdition>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [WorkoutEdition],
            providers: [
                { provide: Apollo, useValue: apolloMock },
                { provide: WORKOUT_STORE, useValue: workoutStoreMock },
                TrackingWorkoutFacade,
                provideNoopAnimations(),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(WorkoutEdition);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
