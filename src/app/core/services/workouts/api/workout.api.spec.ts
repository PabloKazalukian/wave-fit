import { TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';
import { of } from 'rxjs';

import { UPDATE_WORKOUT_SESSION } from '../../../apollo/workout.queries';
import { WorkoutSessionVM } from '../../../../shared/interfaces/tracking.interface';
import { AuthService } from '../../auth/auth.service';
import { ExercisesService } from '../../exercises/exercises.service';
import { WorkoutApi } from './workout.api';

describe('WorkoutApi', () => {
    let api: WorkoutApi;
    let apollo: { query: jasmine.Spy; mutate: jasmine.Spy };

    const workout: WorkoutSessionVM = {
        id: 'ws-2',
        date: '2026-05-02',
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

    beforeEach(() => {
        apollo = {
            query: jasmine.createSpy('query').and.returnValue(of({ data: null })),
            mutate: jasmine.createSpy('mutate').and.returnValue(of({ data: null })),
        };

        TestBed.configureTestingModule({
            providers: [
                WorkoutApi,
                { provide: Apollo, useValue: apollo },
                { provide: AuthService, useValue: { logout: jasmine.createSpy('logout') } },
                {
                    provide: ExercisesService,
                    useValue: { exercises: () => [] },
                },
            ],
        });

        api = TestBed.inject(WorkoutApi);
    });

    it('uses UpdateWorkoutSession with the week-log id in the payload', () => {
        api.updateWorkoutSession(workout, 'week-99').subscribe();

        const args = apollo.mutate.calls.mostRecent().args[0];
        expect(args.mutation).toBe(UPDATE_WORKOUT_SESSION);
        expect(args.variables.updateWorkoutSessionInput.weekLogId).toBe('week-99');
        expect(args.variables.updateWorkoutSessionInput.id).toBe('ws-2');
    });
});
