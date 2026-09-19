import { TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';
import { of, throwError } from 'rxjs';
import {
    CalendarDayType,
    TrainingCalendarResponse,
    TrainingStatus,
} from '../../../shared/interfaces/training-history.interface';
import { TrainingHistoryService } from './training-history.service';

const TIMEZONE = 'America/Buenos_Aires';

describe('TrainingHistoryService', () => {
    let service: TrainingHistoryService;
    let apollo: { query: jasmine.Spy };

    const buildResponse = (): TrainingCalendarResponse => ({
        year: 2026,
        month: 2,
        days: [
            {
                date: '2026-02-02',
                type: CalendarDayType.WEEK_LOG,
                status: TrainingStatus.COMPLETE,
                workoutSessionId: 'ws-1',
                weekLogReference: {
                    id: 'week-1',
                    startDate: '2026-02-02',
                    endDate: '2026-02-08',
                    completed: true,
                    active: true,
                    notes: 'solid week',
                },
            },
            {
                date: '2026-02-03',
                type: CalendarDayType.DAY_LOG,
                status: TrainingStatus.PENDING,
                extraSessionIds: ['extra-1'],
                weekLogReference: null,
            },
        ],
    });

    beforeEach(() => {
        spyOn(console, 'log');
        const resolvedTimeZone = new Intl.DateTimeFormat('en-US', {
            timeZone: TIMEZONE,
        }).resolvedOptions();
        spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').and.returnValue(resolvedTimeZone);
        apollo = {
            query: jasmine.createSpy('apollo.query').and.returnValue(of({ data: null })),
        };

        TestBed.configureTestingModule({
            providers: [TrainingHistoryService, { provide: Apollo, useValue: apollo }],
        });

        service = TestBed.inject(TrainingHistoryService);
    });

    describe('getTrainingCalendar (TEST-001)', () => {
        it('sends month+1 and the resolved timezone with network-only', () => {
            apollo.query.and.returnValue(of({ data: { trainingCalendar: buildResponse() } }));

            service.getTrainingCalendar(2026, 1).subscribe();

            const args = apollo.query.calls.mostRecent().args[0];
            expect(args.fetchPolicy).toBe('network-only');
            expect(args.variables).toEqual({
                input: { year: 2026, month: 2, timezone: TIMEZONE },
            });
        });

        it('keeps the month 1-based for each month of the year', () => {
            apollo.query.and.returnValue(of({ data: { trainingCalendar: buildResponse() } }));
            const calls: number[] = [];

            [0, 5, 11].forEach((month) => {
                service.getTrainingCalendar(2026, month).subscribe();
                calls.push(apollo.query.calls.mostRecent().args[0].variables.input.month);
            });

            expect(calls).toEqual([1, 6, 12]);
        });
    });

    describe('getTrainingCalendar (TEST-002)', () => {
        it('maps the calendar days, type, status and weekLogReference', () => {
            const response = buildResponse();
            apollo.query.and.returnValue(of({ data: { trainingCalendar: response } }));
            let result: TrainingCalendarResponse | undefined;

            service.getTrainingCalendar(2026, 1).subscribe((res) => (result = res));

            expect(result!.days.length).toBe(2);
            expect(result!.days[0].type).toBe(CalendarDayType.WEEK_LOG);
            expect(result!.days[1].type).toBe(CalendarDayType.DAY_LOG);
            expect(result!.days[0].status).toBe(TrainingStatus.COMPLETE);
            expect(result!.days[1].status).toBe(TrainingStatus.PENDING);
            expect(result!.days[0].workoutSessionId).toBe('ws-1');
            expect(result!.days[1].extraSessionIds).toEqual(['extra-1']);
            expect(result!.days[0].weekLogReference?.id).toBe('week-1');
            expect(result!.days[1].weekLogReference).toBeNull();
        });

        it('surfaces GraphQL errors', () => {
            apollo.query.and.returnValue(
                throwError(() => ({
                    graphQLErrors: [{ message: 'nope', extensions: { code: 'FORBIDDEN' } }],
                })),
            );
            let error: { message: string; code: string } | undefined;

            service.getTrainingCalendar(2026, 1).subscribe({ error: (err) => (error = err) });

            expect(error).toEqual({ message: 'nope', code: 'FORBIDDEN' });
        });
    });
});
