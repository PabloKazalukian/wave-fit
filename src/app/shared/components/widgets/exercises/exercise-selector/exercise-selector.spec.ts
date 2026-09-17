import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Apollo } from 'apollo-angular';

import { ExerciseSelector } from './exercise-selector';
import { apolloMock } from '../../../../../core/testing/apollo.mock';
import { workoutStoreMock } from '../../../../../core/testing/workout-store.mock';
import { WORKOUT_STORE } from '../../../../../core/services/workouts/workout-store.interface';

describe('ExerciseSelector', () => {
    let component: ExerciseSelector;
    let fixture: ComponentFixture<ExerciseSelector>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ExerciseSelector],
            providers: [
                { provide: Apollo, useValue: apolloMock },
                { provide: WORKOUT_STORE, useValue: workoutStoreMock },
                provideNoopAnimations(),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ExerciseSelector);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
