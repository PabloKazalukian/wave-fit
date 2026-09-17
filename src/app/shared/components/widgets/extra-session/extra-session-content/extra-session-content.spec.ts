import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';

import { ExtraSessionContent } from './extra-session-content';
import { apolloMock } from '../../../../../core/testing/apollo.mock';
import { workoutStoreMock } from '../../../../../core/testing/workout-store.mock';
import { WORKOUT_STORE } from '../../../../../core/services/workouts/workout-store.interface';

describe('ExtraSessionContent', () => {
    let component: ExtraSessionContent;
    let fixture: ComponentFixture<ExtraSessionContent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ExtraSessionContent],
            providers: [
                { provide: Apollo, useValue: apolloMock },
                { provide: WORKOUT_STORE, useValue: workoutStoreMock },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ExtraSessionContent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
