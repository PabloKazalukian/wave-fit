import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';
import { of } from 'rxjs';
import { Exercise, ExerciseCategory } from '../../../shared/interfaces/exercise.interface';
import { NetworkStatusService } from '../network/network-status.service';
import { IndexedDbStorageService } from '../storage/indexed-db.service';
import { SyncQueueService } from '../sync/sync-queue.service';
import { ExercisesService } from './exercises.service';

describe('ExercisesService', () => {
    let service: ExercisesService;
    let apollo: { query: jasmine.Spy; mutate: jasmine.Spy };
    let network: { isOnline: jasmine.Spy };
    let idb: {
        saveExercises: jasmine.Spy;
        db: { graphqlCache: { get: jasmine.Spy; put: jasmine.Spy } };
    };
    let syncQueue: { registerHandler: jasmine.Spy; enqueue: jasmine.Spy };

    const buildExercise = (overrides: Partial<Exercise> = {}): Exercise => ({
        id: 'ex-1',
        name: 'Bench Press',
        description: 'Chest press',
        category: ExerciseCategory.CHEST,
        usesWeight: true,
        isFavorite: false,
        ...overrides,
    });

    beforeEach(() => {
        apollo = {
            query: jasmine
                .createSpy('apollo.query')
                .and.returnValue(of({ data: { exercises: [] } })),
            mutate: jasmine
                .createSpy('apollo.mutate')
                .and.returnValue(of({ data: { createExercise: buildExercise() } })),
        };
        network = { isOnline: jasmine.createSpy('isOnline').and.returnValue(true) };
        idb = {
            saveExercises: jasmine.createSpy('saveExercises').and.resolveTo(undefined),
            db: {
                graphqlCache: {
                    get: jasmine.createSpy('graphqlCache.get').and.resolveTo(null),
                    put: jasmine.createSpy('graphqlCache.put').and.resolveTo(undefined),
                },
            },
        };
        syncQueue = {
            registerHandler: jasmine.createSpy('registerHandler'),
            enqueue: jasmine.createSpy('enqueue').and.resolveTo(undefined),
        };

        TestBed.configureTestingModule({
            providers: [
                ExercisesService,
                { provide: Apollo, useValue: apollo },
                { provide: NetworkStatusService, useValue: network },
                { provide: IndexedDbStorageService, useValue: idb },
                { provide: SyncQueueService, useValue: syncQueue },
            ],
        });

        service = TestBed.inject(ExercisesService);
    });

    it('registers the CreateExercise offline sync handler', async () => {
        expect(syncQueue.registerHandler).toHaveBeenCalledWith(
            'CreateExercise',
            jasmine.any(Function),
        );

        const handler = syncQueue.registerHandler.calls.mostRecent().args[1] as (m: {
            variables: { input: Exercise };
        }) => Promise<Exercise>;
        const created = buildExercise({ id: 'ex-9' });
        apollo.mutate.and.returnValue(of({ data: { createExercise: created } }));

        await expectAsync(handler({ variables: { input: created } })).toBeResolvedTo(created);
        expect(apollo.mutate).toHaveBeenCalled();
    });

    describe('getExercises (TEST-001)', () => {
        it('fetches from the API, updates the signal and persists the cache', () => {
            const exercises = [buildExercise(), buildExercise({ id: 'ex-2', name: 'Squat' })];
            apollo.query.and.returnValue(of({ data: { exercises } }));
            let result: Exercise[] | undefined;

            service.getExercises().subscribe((res) => (result = res));

            expect(apollo.query).toHaveBeenCalledTimes(1);
            expect(result).toEqual(exercises);
            expect(service.exercises()).toEqual(exercises);
            expect(idb.saveExercises).toHaveBeenCalledWith(exercises);
        });

        it('serves the cached signal without hitting the API', () => {
            const cached = [buildExercise()];
            service.exercises.set(cached);
            let result: Exercise[] | undefined;

            service.getExercises().subscribe((res) => (result = res));

            expect(apollo.query).not.toHaveBeenCalled();
            expect(result).toEqual(cached);
        });

        it('bypasses the cache when force is true', () => {
            service.exercises.set([buildExercise()]);
            const fresh = [buildExercise({ id: 'ex-3', name: 'Deadlift' })];
            apollo.query.and.returnValue(of({ data: { exercises: fresh } }));

            service.getExercises(true).subscribe();

            expect(apollo.query).toHaveBeenCalledTimes(1);
            expect(service.exercises()).toEqual(fresh);
        });
    });

    describe('createExercise (TEST-002)', () => {
        it('calls the API and updates the cache when online', () => {
            const created = buildExercise({ id: 'ex-online' });
            apollo.mutate.and.returnValue(of({ data: { createExercise: created } }));
            network.isOnline.and.returnValue(true);
            let result: Exercise | undefined;

            service
                .createExercise({ ...created, id: undefined })
                .subscribe((res) => (result = res));

            expect(apollo.mutate).toHaveBeenCalled();
            const input = apollo.mutate.calls.mostRecent().args[0].variables.input as Exercise;
            expect(input.id).toBeTruthy();
            expect(result).toEqual(created);
            expect(service.exercises()).toContain(created);
            expect(idb.saveExercises).toHaveBeenCalled();
            expect(syncQueue.enqueue).not.toHaveBeenCalled();
        });

        it('enqueues a CreateExercise mutation when offline', fakeAsync(() => {
            const created = buildExercise({ id: 'ex-offline', name: 'Pull Up' });
            network.isOnline.and.returnValue(false);
            let result: Exercise | undefined;

            service
                .createExercise({ ...created, id: undefined })
                .subscribe((res) => (result = res));
            flushMicrotasks();

            expect(apollo.mutate).not.toHaveBeenCalled();
            expect(syncQueue.enqueue).toHaveBeenCalled();
            const pending = syncQueue.enqueue.calls.mostRecent().args[0];
            expect(pending.operationName).toBe('CreateExercise');
            expect(pending.status).toBe('pending');
            expect(pending.variables.input.id).toBeTruthy();
            expect(result?.name).toBe('Pull Up');
            expect(service.exercises()).toContain(result as Exercise);
        }));

        it('keeps an existing client id when creating offline', fakeAsync(() => {
            const created = buildExercise({ id: 'client-id' });
            network.isOnline.and.returnValue(false);

            service.createExercise(created).subscribe();
            flushMicrotasks();

            const pending = syncQueue.enqueue.calls.mostRecent().args[0];
            expect(pending.variables.input.id).toBe('client-id');
            expect(pending.id).toBe('client-id');
        }));
    });

    describe('setIsFavorite (TEST-003)', () => {
        it('flips the flag optimistically and persists the cache', () => {
            const target = buildExercise({ id: 'ex-fav', isFavorite: false });
            const other = buildExercise({ id: 'ex-other', isFavorite: false });
            service.exercises.set([target, other]);

            service.setIsFavorite('ex-fav', true);

            expect(service.exercises()[0].isFavorite).toBe(true);
            expect(service.exercises()[1].isFavorite).toBe(false);
            expect(idb.saveExercises).toHaveBeenCalledWith(service.exercises());
        });

        it('leaves unknown ids untouched but still persists', () => {
            const target = buildExercise({ id: 'ex-fav', isFavorite: false });
            service.exercises.set([target]);

            service.setIsFavorite('missing', true);

            expect(service.exercises()[0]).toBe(target);
            expect(idb.saveExercises).toHaveBeenCalled();
        });
    });

    describe('wrapperExerciseAPItoVM (FR-005)', () => {
        it('delegates the cached exercises to the VM wrapper', () => {
            service.exercises.set([
                buildExercise({
                    id: 'ex-vm',
                    name: 'Row',
                    category: ExerciseCategory.BACK,
                    usesWeight: false,
                }),
            ]);

            expect(service.wrapperExerciseAPItoVM()).toEqual([
                {
                    exerciseId: 'ex-vm',
                    name: 'Row',
                    series: 0,
                    category: ExerciseCategory.BACK,
                    sets: [],
                    usesWeight: false,
                    isFavorite: false,
                },
            ]);
        });
    });
});
