import { fakeAsync, flushMicrotasks, TestBed, tick } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';
import { BehaviorSubject, of } from 'rxjs';
import { ExerciseCategory } from '../../../shared/interfaces/exercise.interface';
import {
    KindEnum,
    RoutineDay,
    RoutineDayCreate,
} from '../../../shared/interfaces/routines.interface';
import { AuthService } from '../auth/auth.service';
import { NetworkStatusService } from '../network/network-status.service';
import { IndexedDbStorageService } from '../storage/indexed-db.service';
import { SyncQueueService } from '../sync/sync-queue.service';
import { RoutinesApiService } from './api/routines.api';
import { RoutinesService } from './routines.service';

describe('RoutinesService', () => {
    let service: RoutinesService;
    let api: { getRoutines: jasmine.Spy; getRoutineById: jasmine.Spy };
    let network: { isOnline: jasmine.Spy };
    let syncQueue: { registerHandler: jasmine.Spy; enqueue: jasmine.Spy };
    let idb: { saveRoutines: jasmine.Spy };
    let apollo: { mutate: jasmine.Spy; query: jasmine.Spy };

    const buildRoutine = (overrides: Partial<RoutineDay> = {}): RoutineDay => ({
        id: 'rd-1',
        title: 'Push',
        type: [ExerciseCategory.CHEST],
        exercises: [],
        kind: KindEnum.workout,
        isFavorite: false,
        ...overrides,
    });

    const buildCreateData = (): RoutineDayCreate => ({
        title: 'Legs',
        type: [ExerciseCategory.LEGS],
        exercises: [
            { id: 'ex-1', name: 'Squat', category: ExerciseCategory.LEGS, usesWeight: true },
        ],
    });

    beforeEach(() => {
        api = {
            getRoutines: jasmine.createSpy('getRoutines').and.returnValue(of([])),
            getRoutineById: jasmine.createSpy('getRoutineById').and.returnValue(of(undefined)),
        };
        network = { isOnline: jasmine.createSpy('isOnline').and.returnValue(true) };
        syncQueue = {
            registerHandler: jasmine.createSpy('registerHandler'),
            enqueue: jasmine.createSpy('enqueue').and.resolveTo(undefined),
        };
        idb = { saveRoutines: jasmine.createSpy('saveRoutines').and.resolveTo(undefined) };
        apollo = {
            mutate: jasmine.createSpy('mutate').and.returnValue(of({ data: null })),
            query: jasmine.createSpy('query').and.returnValue(of({ data: null })),
        };

        TestBed.configureTestingModule({
            providers: [
                RoutinesService,
                { provide: RoutinesApiService, useValue: api },
                { provide: NetworkStatusService, useValue: network },
                { provide: SyncQueueService, useValue: syncQueue },
                { provide: IndexedDbStorageService, useValue: idb },
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

        service = TestBed.inject(RoutinesService);
        expect(syncQueue.registerHandler).toHaveBeenCalledWith(
            'CreateRoutineDay',
            jasmine.any(Function),
        );
    });

    describe('getAllRoutines / updateAllRoutines (TEST-001)', () => {
        it('fetches once, caches, and refreshes on demand', fakeAsync(() => {
            const first = [buildRoutine()];
            api.getRoutines.and.returnValue(of(first));

            let result: RoutineDay[] | null | undefined;
            service.getAllRoutines().subscribe((res) => (result = res));
            tick(500);

            expect(api.getRoutines).toHaveBeenCalledTimes(1);
            expect(result).toEqual(first);
            expect(idb.saveRoutines).toHaveBeenCalledWith(first);

            service.getAllRoutines().subscribe();
            expect(api.getRoutines).toHaveBeenCalledTimes(1);

            const second = [buildRoutine({ id: 'rd-2' })];
            api.getRoutines.and.returnValue(of(second));
            service.updateAllRoutines().subscribe();
            tick(500);

            expect(api.getRoutines).toHaveBeenCalledTimes(2);
            expect(idb.saveRoutines).toHaveBeenCalledWith(second);
        }));
    });

    describe('getRoutinesByCategory (TEST-002)', () => {
        it('filters the cached routines by exercise category', fakeAsync(() => {
            const chest = buildRoutine({ id: 'rd-1', type: [ExerciseCategory.CHEST] });
            const back = buildRoutine({ id: 'rd-2', type: [ExerciseCategory.BACK] });
            api.getRoutines.and.returnValue(of([chest, back]));

            service.getAllRoutines().subscribe();
            tick(500);

            let result: RoutineDay[] | null | undefined;
            service
                .getRoutinesByCategory(ExerciseCategory.CHEST)
                .subscribe((res) => (result = res));

            expect(result).toEqual([chest]);
        }));
    });

    describe('createRoutine (TEST-003)', () => {
        it('enqueues CreateRoutineDay and caches an optimistic routine when offline', fakeAsync(() => {
            network.isOnline.and.returnValue(false);
            api.getRoutines.and.returnValue(of([]));
            service.getAllRoutines().subscribe();
            tick(500);

            let result: RoutineDayCreate | null | undefined;
            service.createRoutine(buildCreateData()).subscribe((res) => (result = res));
            flushMicrotasks();

            const pending = syncQueue.enqueue.calls.mostRecent().args[0];
            expect(pending.operationName).toBe('CreateRoutineDay');
            expect(pending.variables.createRoutineDayInput).toEqual({
                title: 'Legs',
                type: [ExerciseCategory.LEGS],
                planId: undefined,
                exercises: [{ exercise: 'ex-1', order: 0 }],
            });
            expect(result?.title).toBe('Legs');
            expect(typeof result?.id).toBe('string');

            const createdId = result?.id ?? '';
            let cached: RoutineDay[] = [];
            service.routines$.subscribe((res) => (cached = res));
            expect(cached.map((r) => r.id)).toContain(createdId);
        }));

        it('posts to the API and caches the created routine when online', () => {
            network.isOnline.and.returnValue(true);
            const created = buildRoutine({ id: 'rd-new' });
            apollo.mutate.and.returnValue(of({ data: { createRoutineDay: created } }));

            service.getAllRoutines().subscribe();

            let result: unknown;
            service.createRoutine(buildCreateData()).subscribe((res) => (result = res));

            const args = apollo.mutate.calls.mostRecent().args[0];
            expect(args.variables.createRoutineDayInput.exercises).toEqual([
                { exercise: 'ex-1', order: 0 },
            ]);
            expect(result).toEqual(created);
        });
    });

    describe('setIsFavorite (TEST-004)', () => {
        it('optimistically updates the cache and IndexedDB', fakeAsync(() => {
            const routines = [buildRoutine({ id: 'rd-1' }), buildRoutine({ id: 'rd-2' })];
            api.getRoutines.and.returnValue(of(routines));
            service.getAllRoutines().subscribe();
            tick(500);

            service.setIsFavorite('rd-1', true);

            let cached: RoutineDay[] = [];
            service.routines$.subscribe((res) => (cached = res));
            expect(cached.find((r) => r.id === 'rd-1')?.isFavorite).toBe(true);
            expect(cached.find((r) => r.id === 'rd-2')?.isFavorite).toBe(false);
            expect(idb.saveRoutines).toHaveBeenCalledWith(
                jasmine.arrayContaining([
                    jasmine.objectContaining({ id: 'rd-1', isFavorite: true }),
                ]),
            );
        }));

        it('does nothing when the cache is empty', () => {
            service.setIsFavorite('rd-1', true);

            expect(idb.saveRoutines).not.toHaveBeenCalled();
        });
    });

    it('registers the offline CreateRoutineDay sync handler', () => {
        expect(syncQueue.registerHandler).toHaveBeenCalledWith(
            'CreateRoutineDay',
            jasmine.any(Function),
        );
    });
});
