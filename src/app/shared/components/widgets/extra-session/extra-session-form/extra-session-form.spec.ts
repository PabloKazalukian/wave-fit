import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';

import { ExtraSessionForm } from './extra-session-form';
import { apolloMock } from '../../../../../core/testing/apollo.mock';
import { workoutStoreMock } from '../../../../../core/testing/workout-store.mock';
import { WORKOUT_STORE } from '../../../../../core/services/workouts/workout-store.interface';

describe('ExtraSessionForm', () => {
    let component: ExtraSessionForm;
    let fixture: ComponentFixture<ExtraSessionForm>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ExtraSessionForm],
            providers: [
                { provide: Apollo, useValue: apolloMock },
                { provide: WORKOUT_STORE, useValue: workoutStoreMock },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ExtraSessionForm);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
