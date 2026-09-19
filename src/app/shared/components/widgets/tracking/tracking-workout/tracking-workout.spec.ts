import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';

import { TrackingWorkoutComponent } from './tracking-workout';
import { apolloMock } from '../../../../../core/testing/apollo.mock';
import { workoutStoreMock } from '../../../../../core/testing/workout-store.mock';
import { WORKOUT_STORE } from '../../../../../core/services/workouts/workout-store.interface';

describe('TrackingWorkout', () => {
    let component: TrackingWorkoutComponent;
    let fixture: ComponentFixture<TrackingWorkoutComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TrackingWorkoutComponent],
            providers: [
                { provide: Apollo, useValue: apolloMock },
                { provide: WORKOUT_STORE, useValue: workoutStoreMock },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(TrackingWorkoutComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
