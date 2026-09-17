import { TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';
import { signal } from '@angular/core';

import { ExtraSessionService } from './extra-session.service';
import { WORKOUT_STORE } from '../workouts/workout-store.interface';

describe('ExtraSessionService', () => {
    let service: ExtraSessionService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                { provide: Apollo, useValue: {} },
                { provide: WORKOUT_STORE, useValue: { workoutSession: signal(null) } },
            ],
        });
        service = TestBed.inject(ExtraSessionService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
