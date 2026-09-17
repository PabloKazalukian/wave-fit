import { TestBed } from '@angular/core/testing';
import { DayLogVM } from '../../../shared/interfaces/day-log.interface';
import { IndexedDbStorageService } from '../storage/indexed-db.service';
import { PlanDayStateService } from './plan-day.state';

describe('PlanDayStateService', () => {
    let service: PlanDayStateService;
    let idb: { saveDayLog: jasmine.Spy };

    const buildDayLog = (overrides: Partial<DayLogVM> = {}): DayLogVM => ({
        id: 'day-1',
        userId: 'user-1',
        date: '2026-05-01',
        extraSessionIds: [],
        status: 'pending',
        active: true,
        completed: false,
        exercises: [],
        ...overrides,
    });

    beforeEach(() => {
        idb = { saveDayLog: jasmine.createSpy('saveDayLog').and.resolveTo(undefined) };

        TestBed.configureTestingModule({
            providers: [PlanDayStateService, { provide: IndexedDbStorageService, useValue: idb }],
        });

        service = TestBed.inject(PlanDayStateService);
    });

    it('starts with no active day-log and idle loading flags', () => {
        expect(service.getDayLogValue()).toBeNull();
        expect(service.loading()).toBe(false);
        expect(service.loadingDayLog()).toBe(false);
        expect(service.loadingStatusWorkout()).toBe(false);
        expect(service.loadingWorkoutCreation()).toEqual({ date: '', state: false });
    });

    it('stores the day-log and persists it to IndexedDB', () => {
        const dayLog = buildDayLog();

        service.setDayLog(dayLog);

        expect(service.getDayLogValue()).toEqual(dayLog);
        expect(idb.saveDayLog).toHaveBeenCalledWith(dayLog);
    });

    it('clears the day-log without persisting when set to null', () => {
        service.setDayLog(buildDayLog());
        idb.saveDayLog.calls.reset();

        service.setDayLog(null);

        expect(service.getDayLogValue()).toBeNull();
        expect(idb.saveDayLog).not.toHaveBeenCalled();
    });

    it('emits the day-log through dayLog$', () => {
        const dayLog = buildDayLog();
        let emitted: DayLogVM | null | undefined;
        service.dayLog$.subscribe((value) => (emitted = value));

        service.setDayLog(dayLog);

        expect(emitted).toEqual(dayLog);
    });

    it('applies a partial update through updateDayLog and persists it', () => {
        service.setDayLog(buildDayLog());
        idb.saveDayLog.calls.reset();

        service.updateDayLog((dayLog) => ({ ...dayLog, status: 'complete' }));

        expect(service.getDayLogValue()?.status).toBe('complete');
        expect(idb.saveDayLog).toHaveBeenCalledWith(
            jasmine.objectContaining({ id: 'day-1', status: 'complete' }),
        );
    });

    it('ignores updateDayLog when there is no active day-log', () => {
        service.updateDayLog((dayLog) => ({ ...dayLog, status: 'complete' }));

        expect(service.getDayLogValue()).toBeNull();
        expect(idb.saveDayLog).not.toHaveBeenCalled();
    });

    it('exposes the loading flags setters', () => {
        service.setLoading(true);
        service.setLoadingDayLog(true);
        service.setLoadingStatusWorkout(true);
        service.setLoadingWorkoutCreation('2026-05-01', true);

        expect(service.loading()).toBe(true);
        expect(service.loadingDayLog()).toBe(true);
        expect(service.loadingStatusWorkout()).toBe(true);
        expect(service.loadingWorkoutCreation()).toEqual({ date: '2026-05-01', state: true });
    });

    it('stores the error message', () => {
        service.setError('boom');
        expect(service.error()).toBe('boom');
    });
});
