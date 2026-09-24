import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { STATS_SECTIONS, StatsSection, StatsState } from './stats.state';
import { StatsService } from './stats.service';
import {
    AdherenceVM,
    PersonalRecordsVM,
    TopExercisesVM,
    TopRoutinesVM,
} from '../../../shared/interfaces/stats.interface';

describe('StatsState (TEST-008)', () => {
    let state: StatsState;
    let service: {
        getTopExercises: jasmine.Spy;
        getTopRoutines: jasmine.Spy;
        getPersonalRecords: jasmine.Spy;
        getAdherence: jasmine.Spy;
    };

    const exercisesVm: TopExercisesVM = {
        id: 'te-1',
        userId: 'u-1',
        computedAt: '2026-09-20T10:05:00.000Z',
        exercises: [],
    };
    const routinesVm: TopRoutinesVM = {
        id: 'tr-1',
        userId: 'u-1',
        computedAt: '2026-09-20T10:05:00.000Z',
        routines: [],
    };
    const recordsVm: PersonalRecordsVM = {
        id: 'pr-1',
        userId: 'u-1',
        computedAt: '2026-09-20T10:05:00.000Z',
        records: [],
    };
    const adherenceVm: AdherenceVM = {
        id: 'ad-1',
        userId: 'u-1',
        computedAt: '2026-09-20T10:05:00.000Z',
        weeks: [],
    };

    const getterBySection: Record<StatsSection, () => jasmine.Spy> = {
        topExercises: () => service.getTopExercises,
        topRoutines: () => service.getTopRoutines,
        personalRecords: () => service.getPersonalRecords,
        adherence: () => service.getAdherence,
    };

    beforeEach(() => {
        service = {
            getTopExercises: jasmine.createSpy('getTopExercises').and.returnValue(of(exercisesVm)),
            getTopRoutines: jasmine.createSpy('getTopRoutines').and.returnValue(of(routinesVm)),
            getPersonalRecords: jasmine
                .createSpy('getPersonalRecords')
                .and.returnValue(of(recordsVm)),
            getAdherence: jasmine.createSpy('getAdherence').and.returnValue(of(adherenceVm)),
        };

        TestBed.configureTestingModule({
            providers: [StatsState, { provide: StatsService, useValue: service }],
        });

        state = TestBed.inject(StatsState);
    });

    it('starts with empty, idle entries for every section', () => {
        STATS_SECTIONS.forEach((section) => {
            expect(state.entry(section)()).toEqual({
                data: null,
                loading: false,
                error: null,
                computedAt: null,
            });
        });
    });

    it('load() fetches the four sections in parallel and populates data + computedAt', () => {
        state.load();

        STATS_SECTIONS.forEach((section) => {
            expect(getterBySection[section]()).toHaveBeenCalledTimes(1);
        });
        expect(state.entry('topExercises')().data).toEqual(exercisesVm);
        expect(state.entry('topRoutines')().data).toEqual(routinesVm);
        expect(state.entry('personalRecords')().data).toEqual(recordsVm);
        expect(state.entry('adherence')().data).toEqual(adherenceVm);
        expect(state.entry('topExercises')().computedAt).toBe('2026-09-20T10:05:00.000Z');
        expect(state.entry('topExercises')().loading).toBe(false);
    });

    it('keeps other sections intact when one query fails', () => {
        service.getPersonalRecords.and.returnValue(throwError(() => new Error('boom')));

        state.load();

        expect(state.entry('topExercises')().data).toEqual(exercisesVm);
        expect(state.entry('personalRecords')().error).toBe('boom');
        expect(state.entry('personalRecords')().data).toBeNull();
        expect(state.entry('personalRecords')().loading).toBe(false);
        expect(state.entry('adherence')().error).toBeNull();
    });

    it('reload(section) re-runs a single section only', () => {
        state.load();
        service.getTopRoutines.calls.reset();

        state.reload('topRoutines');

        expect(service.getTopRoutines).toHaveBeenCalledTimes(1);
        expect(service.getTopExercises).toHaveBeenCalledTimes(1);
        expect(service.getPersonalRecords).toHaveBeenCalledTimes(1);
        expect(service.getAdherence).toHaveBeenCalledTimes(1);
    });

    it('reload clears a previous error and stores the fresh data (retry works)', () => {
        service.getAdherence.and.returnValue(throwError(() => new Error('offline')));
        state.load();
        expect(state.entry('adherence')().error).toBe('offline');

        service.getAdherence.and.returnValue(of(adherenceVm));
        state.reload('adherence');

        expect(state.entry('adherence')().error).toBeNull();
        expect(state.entry('adherence')().data).toEqual(adherenceVm);
    });
});
