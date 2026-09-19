import { ApplicationRef, signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import {
    ExtraSession,
    ExtraSessionCategory,
    ExtraSessionDisciplineConfig,
} from '../../../shared/interfaces/extra-session.interface';
import {
    StatusWorkoutSessionEnum,
    TrackingVM,
    WorkoutSessionVM,
} from '../../../shared/interfaces/tracking.interface';
import { PlanDayService } from '../day-logs/plan-day.service';
import { ActiveTrackingService } from '../trackings/active-tracking.service';
import { PlanTrackingService } from '../trackings/plan-tracking.service';
import { WORKOUT_STORE } from '../workouts/workout-store.interface';
import { ExtraSessionApi } from './api/extra-session.api';
import { ExtraSessionService } from './extra-session.service';

describe('ExtraSessionService', () => {
    let service: ExtraSessionService;
    let api: {
        getCatalog: jasmine.Spy;
        getByIds: jasmine.Spy;
        getByWorkoutSession: jasmine.Spy;
        update: jasmine.Spy;
        remove: jasmine.Spy;
    };
    let trackingSvc: { updateExtraSession: jasmine.Spy; removeExtraSession: jasmine.Spy };
    let planDaySvc: { updateExtraSession: jasmine.Spy; removeExtraSession: jasmine.Spy };
    let activeSvc: { isDayLogActive: jasmine.Spy };
    let workoutSessionSignal: WritableSignal<WorkoutSessionVM | null>;
    let selectedDateSignal: WritableSignal<string | null>;

    const catalog: ExtraSessionDisciplineConfig[] = [
        { key: 'run', label: 'Running', category: ExtraSessionCategory.CARDIO, met: 9.8 },
    ];

    const buildExtraSession = (
        id: string,
        overrides: Partial<ExtraSession> = {},
    ): ExtraSession => ({
        id,
        userId: 'user-1',
        workoutSessionId: 'ws-1',
        category: ExtraSessionCategory.CARDIO,
        discipline: 'Running',
        date: '2026-05-01',
        duration: 30,
        intensityLevel: 3,
        calories: 200,
        ...overrides,
    });

    const form = {
        date: '2026-05-01',
        discipline: 'Running',
        duration: 30,
        intensityLevel: 3,
        calories: 200,
        notes: 'easy',
    };

    beforeEach(() => {
        api = {
            getCatalog: jasmine.createSpy('getCatalog').and.returnValue(of(catalog)),
            getByIds: jasmine.createSpy('getByIds').and.returnValue(of([])),
            getByWorkoutSession: jasmine.createSpy('getByWorkoutSession').and.returnValue(of([])),
            update: jasmine.createSpy('update'),
            remove: jasmine.createSpy('remove').and.returnValue(of(true)),
        };
        trackingSvc = {
            updateExtraSession: jasmine.createSpy('updateExtraSession'),
            removeExtraSession: jasmine.createSpy('removeExtraSession'),
        };
        planDaySvc = {
            updateExtraSession: jasmine.createSpy('updateExtraSession'),
            removeExtraSession: jasmine.createSpy('removeExtraSession'),
        };
        activeSvc = { isDayLogActive: jasmine.createSpy('isDayLogActive').and.returnValue(false) };
        workoutSessionSignal = signal<WorkoutSessionVM | null>(null);
        selectedDateSignal = signal<string | null>('2026-05-01');

        TestBed.configureTestingModule({
            providers: [
                ExtraSessionService,
                { provide: ExtraSessionApi, useValue: api },
                { provide: PlanTrackingService, useValue: trackingSvc },
                { provide: PlanDayService, useValue: planDaySvc },
                { provide: ActiveTrackingService, useValue: activeSvc },
                {
                    provide: WORKOUT_STORE,
                    useValue: {
                        workoutSession: workoutSessionSignal,
                        selectedDate: selectedDateSignal,
                    },
                },
            ],
        });

        service = TestBed.inject(ExtraSessionService);
    });

    describe('loadCatalog (TEST-001)', () => {
        it('fetches the catalog once and caches it', () => {
            let emitted: ExtraSessionDisciplineConfig[] | undefined;
            service.catalog$.subscribe((value) => (emitted = value));

            service.loadCatalog();
            service.loadCatalog();

            expect(api.getCatalog).toHaveBeenCalledTimes(1);
            expect(emitted).toEqual(catalog);
        });
    });

    describe('create (TEST-002)', () => {
        it('routes to PlanDayService when the day-log is active', () => {
            activeSvc.isDayLogActive.and.returnValue(true);
            planDaySvc.updateExtraSession.and.returnValue(of({ id: 'day-1' }));

            let result: unknown;
            service.create(form).subscribe((res) => (result = res));

            expect(planDaySvc.updateExtraSession).toHaveBeenCalledWith(form);
            expect(trackingSvc.updateExtraSession).not.toHaveBeenCalled();
            expect(result).toBeNull();
        });

        it('routes to PlanTrackingService when the week-log is active', () => {
            activeSvc.isDayLogActive.and.returnValue(false);
            const tracking = { id: 't-1' } as TrackingVM;
            trackingSvc.updateExtraSession.and.returnValue(of(tracking));

            let result: unknown;
            service.create(form).subscribe((res) => (result = res));

            expect(trackingSvc.updateExtraSession).toHaveBeenCalledWith('2026-05-01', form);
            expect(planDaySvc.updateExtraSession).not.toHaveBeenCalled();
            expect(result).toEqual(tracking);
        });

        it('does nothing when there is no selected date', () => {
            selectedDateSignal.set(null);

            let result: unknown;
            service.create(form).subscribe((res) => (result = res));

            expect(result).toBeNull();
            expect(planDaySvc.updateExtraSession).not.toHaveBeenCalled();
            expect(trackingSvc.updateExtraSession).not.toHaveBeenCalled();
        });
    });

    describe('remove (TEST-003)', () => {
        it('routes to PlanDayService when the day-log is active', () => {
            activeSvc.isDayLogActive.and.returnValue(true);
            planDaySvc.removeExtraSession.and.returnValue(of({ id: 'day-1' }));

            service.remove('x-1').subscribe();

            expect(planDaySvc.removeExtraSession).toHaveBeenCalledWith('x-1');
            expect(trackingSvc.removeExtraSession).not.toHaveBeenCalled();
        });

        it('routes to PlanTrackingService when the week-log is active', () => {
            activeSvc.isDayLogActive.and.returnValue(false);
            trackingSvc.removeExtraSession.and.returnValue(of({ id: 't-1' }));

            service.remove('x-1').subscribe();

            expect(trackingSvc.removeExtraSession).toHaveBeenCalledWith('2026-05-01', 'x-1');
            expect(planDaySvc.removeExtraSession).not.toHaveBeenCalled();
        });

        it('does nothing when there is no selected date', () => {
            selectedDateSignal.set(null);

            service.remove('x-1').subscribe();

            expect(planDaySvc.removeExtraSession).not.toHaveBeenCalled();
            expect(trackingSvc.removeExtraSession).not.toHaveBeenCalled();
        });
    });

    describe('update (TEST-004)', () => {
        it('reflects the change in activeWorkoutSessions$', () => {
            const first = buildExtraSession('x-1');
            const second = buildExtraSession('x-2');
            api.getByIds.and.returnValue(of([first, second]));

            service.loadByWorkoutSession(['x-1', 'x-2']);

            const updated = buildExtraSession('x-1', { duration: 99 });
            api.update.and.returnValue(of(updated));

            let listed: ExtraSession[] | undefined;
            service.activeWorkoutSessions$.subscribe((value) => (listed = value));

            service.update({ id: 'x-1', duration: 99 }).subscribe();

            expect(api.update).toHaveBeenCalledWith({ id: 'x-1', duration: 99 });
            expect(listed?.find((s) => s.id === 'x-1')?.duration).toBe(99);
            expect(service.extraSessions().find((s) => s.id === 'x-1')?.duration).toBe(99);
        });
    });

    describe('extraSessions (TEST-005)', () => {
        it('reloads sessions when the store extras ids change', () => {
            const appRef = TestBed.inject(ApplicationRef);
            const session = buildExtraSession('x-1');
            api.getByIds.and.returnValue(of([session]));

            workoutSessionSignal.set({
                id: 'ws-1',
                date: '2026-05-01',
                exercises: [],
                status: StatusWorkoutSessionEnum.NOT_STARTED,
                extras: ['x-1'],
            });
            appRef.tick();

            expect(api.getByIds).toHaveBeenCalledWith(['x-1']);
            expect(service.extraSessions()).toEqual([session]);
        });
    });
});
