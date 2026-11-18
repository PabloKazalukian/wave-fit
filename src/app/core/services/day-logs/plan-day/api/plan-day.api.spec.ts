import { TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';
import { of } from 'rxjs';

import {
    REMOVE_EXTRA_SESSION_FROM_DEFERRED_DAY_LOG,
    UPDATE_DAY_LOG,
} from '../../../../apollo/day-log.queries';
import { AuthService } from '../../../auth/auth.service';
import { ExercisesService } from '../../../exercises/exercises.service';
import { StatusWorkoutSessionEnum } from '../../../../../shared/interfaces/tracking.interface';
import { PlanDayStateService } from '../../plan-day.state';
import { PlanDayApi } from './plan-day.api';

describe('PlanDayApi', () => {
    let api: PlanDayApi;
    let apollo: { query: jasmine.Spy; mutate: jasmine.Spy };
    let state: { getDayLogValue: jasmine.Spy };

    beforeEach(() => {
        apollo = {
            query: jasmine.createSpy('query').and.returnValue(of({ data: null })),
            mutate: jasmine.createSpy('mutate').and.returnValue(of({ data: null })),
        };
        state = { getDayLogValue: jasmine.createSpy('getDayLogValue').and.returnValue(null) };

        TestBed.configureTestingModule({
            providers: [
                PlanDayApi,
                { provide: Apollo, useValue: apollo },
                { provide: AuthService, useValue: { logout: jasmine.createSpy('logout') } },
                {
                    provide: ExercisesService,
                    useValue: { getExercises: () => of([]), exercises: () => [] },
                },
                { provide: PlanDayStateService, useValue: state },
            ],
        });

        api = TestBed.inject(PlanDayApi);
    });

    it('maps a deferred UpdateDayLog result without reading active day-log state', () => {
        apollo.mutate.and.returnValue(
            of({
                data: {
                    updateDayLog: {
                        id: 'deferred-day',
                        status: 'complete',
                        workoutSessionId: 'ws-1',
                        exercises: [],
                    },
                },
            }),
        );

        const result = jasmine.createSpy('result');
        api.updateDayLogDeferred({
            id: 'deferred-day',
            workoutSession: { id: 'ws-1', status: StatusWorkoutSessionEnum.COMPLETE },
        }).subscribe(result);

        expect(state.getDayLogValue).not.toHaveBeenCalled();
        expect(result).toHaveBeenCalledWith(
            jasmine.objectContaining({ id: 'deferred-day', workoutSessionId: 'ws-1' }),
        );
    });

    it('persists a full workout edit through UpdateDayLog with id and workoutSession', () => {
        const workoutSession = {
            id: 'ws-1',
            date: '2026-05-01',
            status: StatusWorkoutSessionEnum.COMPLETE,
            exercises: [
                {
                    exerciseId: 'ex-1',
                    series: 2,
                    sets: [{ reps: 10, weights: 50 }],
                    notes: 'last set',
                },
            ],
        };

        api.updateDayLog({ id: 'day-1', workoutSession }).subscribe();

        const args = apollo.mutate.calls.mostRecent().args[0];
        expect(args.mutation).toBe(UPDATE_DAY_LOG);
        expect(args.variables).toEqual({ input: { id: 'day-1', workoutSession } });
    });

    it('sends extraSessionId when removing an extra-session from a day-log', () => {
        api.removeExtraSessionFromDayLog('es-1').subscribe();

        const args = apollo.mutate.calls.mostRecent().args[0];
        expect(args.variables).toEqual({ extraSessionId: 'es-1' });
        expect(String(args.mutation.loc?.source?.body)).toContain('extraSessionId');
    });

    it('uses the deferred delete mutation without reading active day-log state', () => {
        apollo.mutate.and.returnValue(
            of({
                data: {
                    removeExtraSessionFromDeferredDayLog: {
                        id: 'deferred-day',
                        active: false,
                        completed: false,
                        status: 'pending',
                        extraSessionIds: [],
                    },
                },
            }),
        );

        const result = jasmine.createSpy('result');
        api.removeExtraSessionFromDeferredDayLog('es-1').subscribe(result);

        const args = apollo.mutate.calls.mostRecent().args[0];
        expect(args.mutation).toBe(REMOVE_EXTRA_SESSION_FROM_DEFERRED_DAY_LOG);
        expect(args.variables).toEqual({ extraSessionId: 'es-1' });
        expect(state.getDayLogValue).not.toHaveBeenCalled();
        expect(result).toHaveBeenCalledWith(
            jasmine.objectContaining({ id: 'deferred-day', extraSessionIds: [] }),
        );
    });
});
