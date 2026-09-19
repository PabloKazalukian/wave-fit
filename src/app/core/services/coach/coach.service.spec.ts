import { TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';
import { of, throwError } from 'rxjs';
import {
    AiUsageStatus,
    ConfirmPlanOutput,
    PlanConfirmationAction,
    TrainingPlanDetail,
    TrainingPlansPage,
} from '../../../shared/interfaces/coach.interface';
import { CoachService } from './coach.service';

describe('CoachService', () => {
    let service: CoachService;
    let apollo: { query: jasmine.Spy; mutate: jasmine.Spy };

    const buildPlan = (overrides: Partial<TrainingPlanDetail> = {}): TrainingPlanDetail =>
        ({
            id: 'plan-1',
            title: 'Hypertrophy',
            description: '4 weeks',
            focus: 'muscle',
            status: 'draft',
            startDate: '2026-01-01',
            endDate: '2026-01-28',
            durationWeeks: 4,
            trainingDaysPerWeek: 4,
            tags: ['gym'],
            aiSnapshot: { modelUsed: 'gpt', tokensUsed: 10, rawResponse: '{}' },
            ...overrides,
        }) as TrainingPlanDetail;

    const buildPage = (): TrainingPlansPage => ({
        items: [{ id: 'plan-1' } as never],
        total: 1,
        limit: 10,
        offset: 0,
        totalPages: 1,
    });

    beforeEach(() => {
        apollo = {
            query: jasmine.createSpy('apollo.query').and.returnValue(of({ data: null })),
            mutate: jasmine.createSpy('apollo.mutate').and.returnValue(of({ data: null })),
        };

        TestBed.configureTestingModule({
            providers: [CoachService, { provide: Apollo, useValue: apollo }],
        });

        service = TestBed.inject(CoachService);
    });

    describe('generatePlan (TEST-001)', () => {
        it('passes the comment and maps the generated plan', () => {
            const plan = buildPlan();
            apollo.mutate.and.returnValue(of({ data: { generatePlan: plan } }));
            let result: TrainingPlanDetail | null | undefined;

            service.generatePlan('build muscle').subscribe((res) => (result = res));

            expect(apollo.mutate.calls.mostRecent().args[0].variables).toEqual({
                comment: 'build muscle',
            });
            expect(result).toEqual(plan);
        });

        it('returns null when the API yields no plan', () => {
            apollo.mutate.and.returnValue(of({ data: null }));
            let result: TrainingPlanDetail | null | undefined;

            service.generatePlan().subscribe((res) => (result = res));

            expect(result).toBeNull();
        });

        it('surfaces GraphQL errors with message and code', () => {
            apollo.mutate.and.returnValue(
                throwError(() => ({
                    graphQLErrors: [{ message: 'boom', extensions: { code: 'BAD_REQUEST' } }],
                })),
            );
            let error: { message: string; code: string } | undefined;

            service.generatePlan('x').subscribe({ error: (err) => (error = err) });

            expect(error).toEqual({ message: 'boom', code: 'BAD_REQUEST' });
        });

        it('maps UNAUTHORIZED GraphQL errors to the UNAUTHORIZED code', () => {
            apollo.mutate.and.returnValue(
                throwError(() => ({
                    graphQLErrors: [{ message: 'nope', extensions: { code: 'UNAUTHORIZED' } }],
                })),
            );
            let error: Error | undefined;

            service.generatePlan('x').subscribe({ error: (err) => (error = err) });

            expect(error?.message).toBe('UNAUTHORIZED');
        });
    });

    describe('modifyPlan (FR-003)', () => {
        it('passes id and comment and maps the revised plan', () => {
            const plan = buildPlan({ id: 'plan-2' });
            apollo.mutate.and.returnValue(of({ data: { modifyPlan: plan } }));
            let result: TrainingPlanDetail | null | undefined;

            service.modifyPlan('plan-2', 'less volume').subscribe((res) => (result = res));

            expect(apollo.mutate.calls.mostRecent().args[0].variables).toEqual({
                id: 'plan-2',
                comment: 'less volume',
            });
            expect(result).toEqual(plan);
        });
    });

    describe('confirmPlan (TEST-002)', () => {
        it('passes the action and surfaces the ConfirmPlanOutput', () => {
            const output: ConfirmPlanOutput = {
                trainingPlan: { id: 'plan-1' } as never,
                weekLog: { id: 'week-1' } as never,
                routinePlan: null,
            };
            apollo.mutate.and.returnValue(of({ data: { confirmPlan: output } }));
            let result: ConfirmPlanOutput | null | undefined;

            service.confirmPlan('plan-1', 'CREATE_WEEK_LOG').subscribe((res) => (result = res));

            expect(apollo.mutate.calls.mostRecent().args[0].variables).toEqual({
                id: 'plan-1',
                action: 'CREATE_WEEK_LOG',
            });
            expect(result).toEqual(output);
        });

        it('passes every confirmation action verbatim', () => {
            const actions: PlanConfirmationAction[] = [
                'CREATE_WEEK_LOG',
                'CREATE_ROUTINE_PLAN',
                'ADAPT_ACTIVE_WEEK',
            ];
            apollo.mutate.and.returnValue(of({ data: { confirmPlan: { trainingPlan: {} } } }));

            actions.forEach((action) => service.confirmPlan('plan-1', action).subscribe());

            expect(apollo.mutate.calls.allArgs().map(([arg]) => arg.variables.action)).toEqual(
                actions,
            );
        });

        it('returns null when the API yields nothing', () => {
            apollo.mutate.and.returnValue(of({ data: null }));
            let result: ConfirmPlanOutput | null | undefined;

            service.confirmPlan('plan-1', 'CREATE_WEEK_LOG').subscribe((res) => (result = res));

            expect(result).toBeNull();
        });
    });

    describe('getPlanTrainings (TEST-003)', () => {
        it('queries network-only and maps the page', () => {
            const page = buildPage();
            apollo.query.and.returnValue(of({ data: { trainingPlans: page } }));
            let result: TrainingPlansPage | null | undefined;

            service.getPlanTrainings(10, 20).subscribe((res) => (result = res));

            const args = apollo.query.calls.mostRecent().args[0];
            expect(args.fetchPolicy).toBe('network-only');
            expect(args.variables).toEqual({ limit: 10, offset: 20 });
            expect(result).toEqual(page);
        });

        it('returns null when the API yields nothing', () => {
            apollo.query.and.returnValue(of({ data: null }));
            let result: TrainingPlansPage | null | undefined;

            service.getPlanTrainings(10, 0).subscribe((res) => (result = res));

            expect(result).toBeNull();
        });
    });

    describe('getPlanTrainingById (FR-006)', () => {
        it('reads with the default cache-first policy', () => {
            const plan = buildPlan();
            apollo.query.and.returnValue(of({ data: { trainingPlan: plan } }));
            let result: TrainingPlanDetail | null | undefined;

            service.getPlanTrainingById('plan-1').subscribe((res) => (result = res));

            const args = apollo.query.calls.mostRecent().args[0];
            expect(args.fetchPolicy).toBeUndefined();
            expect(args.variables).toEqual({ id: 'plan-1' });
            expect(result).toEqual(plan);
        });
    });

    describe('removePlantraningById (FR-007)', () => {
        it('maps the removed plan', () => {
            const plan = buildPlan();
            apollo.mutate.and.returnValue(of({ data: { removePlan: plan } }));
            let result: TrainingPlanDetail | null | undefined;

            service.removePlantraningById('plan-1').subscribe((res) => (result = res));

            expect(apollo.mutate.calls.mostRecent().args[0].variables).toEqual({ id: 'plan-1' });
            expect(result).toEqual(plan);
        });
    });

    describe('getAiUsageStatus (FR-008)', () => {
        it('queries network-only and maps the usage status', () => {
            const usage: AiUsageStatus = {
                used: 2,
                limit: 10,
                remaining: 8,
                resetAt: '2026-02-01',
            };
            apollo.query.and.returnValue(of({ data: { aiUsageStatus: usage } }));
            let result: AiUsageStatus | null | undefined;

            service.getAiUsageStatus().subscribe((res) => (result = res));

            expect(apollo.query.calls.mostRecent().args[0].fetchPolicy).toBe('network-only');
            expect(result).toEqual(usage);
        });
    });
});
