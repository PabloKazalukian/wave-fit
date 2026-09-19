import { TestBed } from '@angular/core/testing';
import { IndexedDbStorageService } from './indexed-db.service';

describe('IndexedDbStorageService (TEST-003)', () => {
    let service: IndexedDbStorageService;
    let tables: {
        exercises: { clear: jasmine.Spy; bulkPut: jasmine.Spy };
        routines: { clear: jasmine.Spy; bulkPut: jasmine.Spy };
        plans: { put: jasmine.Spy };
        tracking: { put: jasmine.Spy; bulkPut: jasmine.Spy };
        dayLogs: { put: jasmine.Spy };
    };

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [IndexedDbStorageService] });
        service = TestBed.inject(IndexedDbStorageService);

        tables = {
            exercises: {
                clear: jasmine.createSpy('exercises.clear').and.resolveTo(undefined),
                bulkPut: jasmine.createSpy('exercises.bulkPut').and.resolveTo(undefined),
            },
            routines: {
                clear: jasmine.createSpy('routines.clear').and.resolveTo(undefined),
                bulkPut: jasmine.createSpy('routines.bulkPut').and.resolveTo(undefined),
            },
            plans: { put: jasmine.createSpy('plans.put').and.resolveTo(undefined) },
            tracking: {
                put: jasmine.createSpy('tracking.put').and.resolveTo(undefined),
                bulkPut: jasmine.createSpy('tracking.bulkPut').and.resolveTo(undefined),
            },
            dayLogs: { put: jasmine.createSpy('dayLogs.put').and.resolveTo(undefined) },
        };
        service.db = tables as never;
    });

    it('replaces the exercises table contents', async () => {
        const exercises = [{ id: 'e1' }, { id: 'e2' }];

        await service.saveExercises(exercises);

        expect(tables.exercises.clear).toHaveBeenCalled();
        expect(tables.exercises.bulkPut).toHaveBeenCalledWith(exercises);
    });

    it('replaces the routines table contents', async () => {
        const routines = [{ id: 'r1' }];

        await service.saveRoutines(routines);

        expect(tables.routines.clear).toHaveBeenCalled();
        expect(tables.routines.bulkPut).toHaveBeenCalledWith(routines);
    });

    it('puts a plan when it has an id', async () => {
        const plan = { id: 'p1', name: 'Plan A' };

        await service.savePlan(plan);

        expect(tables.plans.put).toHaveBeenCalledWith(plan);
    });

    it('ignores plans without an id', async () => {
        await service.savePlan({ name: 'draft' });

        expect(tables.plans.put).not.toHaveBeenCalled();
    });

    it('bulk-puts trackings', async () => {
        const trackings = [{ id: 't1' }];

        await service.saveTrackings(trackings);

        expect(tables.tracking.bulkPut).toHaveBeenCalledWith(trackings);
    });

    it('puts a single tracking only when it has an id', async () => {
        await service.saveTracking({ id: 't1' });
        await service.saveTracking({});

        expect(tables.tracking.put).toHaveBeenCalledTimes(1);
        expect(tables.tracking.put).toHaveBeenCalledWith({ id: 't1' });
    });

    it('puts a day log only when it has an id', async () => {
        await service.saveDayLog({ id: 'd1' });
        await service.saveDayLog({});

        expect(tables.dayLogs.put).toHaveBeenCalledTimes(1);
        expect(tables.dayLogs.put).toHaveBeenCalledWith({ id: 'd1' });
    });

    it('swallows storage errors and logs them', async () => {
        tables.exercises.bulkPut.and.rejectWith(new Error('quota'));
        const errorSpy = spyOn(console, 'error');

        await expectAsync(service.saveExercises([{ id: 'e1' }])).toBeResolved();

        expect(errorSpy).toHaveBeenCalled();
    });
});
