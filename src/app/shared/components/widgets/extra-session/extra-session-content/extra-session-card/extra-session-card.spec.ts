import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';

import { ExtraSessionCard } from './extra-session-card';
import { apolloMock } from '../../../../../../core/testing/apollo.mock';
import { workoutStoreMock } from '../../../../../../core/testing/workout-store.mock';
import { WORKOUT_STORE } from '../../../../../../core/services/workouts/workout-store.interface';
import { ExtraSession } from '../../../../../interfaces/extra-session.interface';

describe('ExtraSessionCard', () => {
    let component: ExtraSessionCard;
    let fixture: ComponentFixture<ExtraSessionCard>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ExtraSessionCard],
            providers: [
                { provide: Apollo, useValue: apolloMock },
                { provide: WORKOUT_STORE, useValue: workoutStoreMock },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ExtraSessionCard);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('session', {
            id: 'extra-1',
            duration: 30,
            intensityLevel: 3,
            calories: 0,
            discipline: 'running',
        } as unknown as ExtraSession);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
