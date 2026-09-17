import { TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';
import { BehaviorSubject, of } from 'rxjs';
import { ExerciseCategory } from '../../../../shared/interfaces/exercise.interface';
import {
    KindEnum,
    RoutinePlanSend,
    RoutinePlanVM,
} from '../../../../shared/interfaces/routines.interface';
import { AuthService } from '../../auth/auth.service';
import { PlansApiService } from './plans.api';

describe('PlansApiService', () => {
    let service: PlansApiService;
    let apollo: { query: jasmine.Spy; mutate: jasmine.Spy };

    const payload: RoutinePlanSend = {
        name: 'Plan A',
        description: '',
        weekly_distribution: '',
        routineDays: ['rd-1', ''],
    };

    beforeEach(() => {
        apollo = {
            query: jasmine.createSpy('query').and.returnValue(of({ data: null })),
            mutate: jasmine.createSpy('mutate').and.returnValue(of({ data: null })),
        };

        TestBed.configureTestingModule({
            providers: [
                PlansApiService,
                { provide: Apollo, useValue: apollo },
                {
                    provide: AuthService,
                    useValue: {
                        user$: new BehaviorSubject(null),
                        logout: jasmine.createSpy('logout'),
                    },
                },
            ],
        });

        service = TestBed.inject(PlansApiService);
    });

    describe('validateTitleUnique (TEST-001)', () => {
        it('rejects duplicate titles (server returns false)', () => {
            apollo.query.and.returnValue(of({ data: { isRoutineTitleAvailable: false } }));

            let result: boolean | undefined;
            service.validateTitleUnique('Plan A').subscribe((res) => (result = res));

            const args = apollo.query.calls.mostRecent().args[0];
            expect(args.variables).toEqual({ input: { title: 'Plan A' } });
            expect(result).toBe(false);
        });

        it('accepts an available title (server returns true)', () => {
            apollo.query.and.returnValue(of({ data: { isRoutineTitleAvailable: true } }));

            let result: boolean | undefined;
            service.validateTitleUnique('Plan B').subscribe((res) => (result = res));

            expect(result).toBe(true);
        });
    });

    describe('createPlan', () => {
        it('sends the payload as input and returns the created plan', () => {
            const created = { id: 'plan-1', ...payload, routineDays: [] };
            apollo.mutate.and.returnValue(of({ data: { createRoutinePlan: created } }));

            let result: unknown;
            service.createPlan(payload).subscribe((res) => (result = res));

            const args = apollo.mutate.calls.mostRecent().args[0];
            expect(args.variables).toEqual({ input: payload });
            expect(result).toEqual(created);
        });
    });

    describe('getRoutinePlanById', () => {
        it('wraps the API routine days into VMs', () => {
            apollo.query.and.returnValue(
                of({
                    data: {
                        routinePlan: {
                            id: 'plan-1',
                            name: 'Plan A',
                            description: '',
                            weekly_distribution: null,
                            routineDays: [
                                {
                                    id: 'rd-1',
                                    title: 'Push',
                                    kind: KindEnum.workout,
                                    category: [],
                                    exercises: [
                                        {
                                            order: 0,
                                            exercise: {
                                                id: 'ex-1',
                                                name: 'Bench',
                                                category: ExerciseCategory.CHEST,
                                                usesWeight: true,
                                            },
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                }),
            );

            let result: RoutinePlanVM | null | undefined;
            service.getRoutinePlanById('plan-1').subscribe((res) => (result = res));

            expect(result?.weekly_distribution).toBe('');
            expect(result?.routineDays[0].id).toBe('rd-1');
        });

        it('returns undefined when the plan has no routine days', () => {
            apollo.query.and.returnValue(
                of({
                    data: {
                        routinePlan: { id: 'plan-1', name: 'Plan A', description: '' },
                    },
                }),
            );

            let result: unknown;
            service.getRoutinePlanById('plan-1').subscribe((res) => (result = res));

            expect(result).toBeUndefined();
        });
    });
});
