import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Apollo } from 'apollo-angular';

import { WorkoutCompleteList } from './workout-complete-list';
import { apolloMock } from '../../../../../../core/testing/apollo.mock';
import { workoutStoreMock } from '../../../../../../core/testing/workout-store.mock';
import { WORKOUT_STORE } from '../../../../../../core/services/workouts/workout-store.interface';
import { TrackingWorkoutFacade } from '../tracking-workout.facade';

describe('WorkoutCompleteList', () => {
    let component: WorkoutCompleteList;
    let fixture: ComponentFixture<WorkoutCompleteList>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [WorkoutCompleteList],
            providers: [
                { provide: Apollo, useValue: apolloMock },
                { provide: WORKOUT_STORE, useValue: workoutStoreMock },
                TrackingWorkoutFacade,
                provideNoopAnimations(),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(WorkoutCompleteList);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
