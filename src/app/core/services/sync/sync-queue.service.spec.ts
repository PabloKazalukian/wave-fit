import { ApplicationRef } from '@angular/core';
import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { NetworkStatusService } from '../network/network-status.service';
import { IndexedDbStorageService, PendingMutation } from '../storage/indexed-db.service';
import { SyncQueueService } from './sync-queue.service';

describe('SyncQueueService (TEST-002)', () => {
    let service: SyncQueueService;
    let rows: PendingMutation[];
    let store: {
        count: jasmine.Spy;
        put: jasmine.Spy;
        delete: jasmine.Spy;
        get: jasmine.Spy;
        update: jasmine.Spy;
        where: jasmine.Spy;
    };
    const online = { value: false };

    const buildMutation = (overrides: Partial<PendingMutation> = {}): PendingMutation => ({
        id: 'm-1',
        operationName: 'CreateExercise',
        variables: {},
        status: 'pending',
        createdAt: 1,
        ...overrides,
    });

    beforeEach(() => {
        rows = [];
        store = {
            count: jasmine.createSpy('pendingMutations.count').and.resolveTo(0),
            put: jasmine.createSpy('pendingMutations.put').and.resolveTo(undefined),
            delete: jasmine.createSpy('pendingMutations.delete').and.resolveTo(undefined),
            get: jasmine
                .createSpy('pendingMutations.get')
                .and.callFake((id: string) =>
                    Promise.resolve(rows.find((row) => row.id === id) ?? null),
                ),
            update: jasmine
                .createSpy('pendingMutations.update')
                .and.callFake((id: string, changes: Partial<PendingMutation>) => {
                    const row = rows.find((item) => item.id === id);
                    if (row) Object.assign(row, changes);
                    return Promise.resolve(1);
                }),
            where: jasmine.createSpy('pendingMutations.where').and.returnValue({
                anyOf: jasmine
                    .createSpy('anyOf')
                    .and.callFake(() => ({ toArray: () => Promise.resolve([...rows]) })),
            }),
        };
        online.value = false;
        spyOn(console, 'error');
        spyOn(console, 'warn');

        TestBed.configureTestingModule({
            providers: [
                SyncQueueService,
                {
                    provide: NetworkStatusService,
                    useValue: {
                        isOnline: jasmine.createSpy('isOnline').and.callFake(() => online.value),
                    },
                },
                { provide: IndexedDbStorageService, useValue: { db: { pendingMutations: store } } },
            ],
        });

        service = TestBed.inject(SyncQueueService);
    });

    describe('pending count', () => {
        it('reflects the stored count', async () => {
            store.count.and.resolveTo(5);

            await service.updatePendingCount();

            expect(service.pendingCount()).toBe(5);
        });

        it('increments on enqueue and floors at zero on dequeue', async () => {
            const syncRegister = jasmine.createSpy('sync.register').and.resolveTo(undefined);
            spyOnProperty(navigator.serviceWorker, 'ready', 'get').and.returnValue(
                Promise.resolve({ sync: { register: syncRegister } } as never),
            );
            await service.updatePendingCount();

            await service.enqueue(buildMutation());
            expect(store.put).toHaveBeenCalled();
            expect(service.pendingCount()).toBe(1);
            expect(syncRegister).toHaveBeenCalledWith('sync-mutations');

            await service.dequeue('m-1');
            expect(store.delete).toHaveBeenCalledWith('m-1');
            expect(service.pendingCount()).toBe(0);

            await service.dequeue('missing');
            expect(service.pendingCount()).toBe(0);
        });
    });

    describe('processQueue (TEST-002)', () => {
        it('replays pending mutations in FIFO order and dequeues successes', async () => {
            const order: string[] = [];
            service.registerHandler('CreateExercise', async (mutation) => {
                order.push(mutation.id);
                return true;
            });
            rows = [
                buildMutation({ id: 'm-2', createdAt: 2 }),
                buildMutation({ id: 'm-1', createdAt: 1 }),
            ];

            await service.processQueue();

            expect(order).toEqual(['m-1', 'm-2']);
            expect(store.update).toHaveBeenCalledWith('m-1', { status: 'syncing' });
            expect(store.delete).toHaveBeenCalledWith('m-1');
            expect(store.delete).toHaveBeenCalledWith('m-2');
        });

        it('retries a failing mutation below the retry limit', async () => {
            service.registerHandler('CreateExercise', async () => {
                throw new Error('network');
            });
            rows = [buildMutation({ id: 'm-1', retryCount: 0 })];

            await service.processQueue();

            expect(store.update).toHaveBeenCalledWith('m-1', { status: 'pending', retryCount: 1 });
            expect(store.delete).not.toHaveBeenCalled();
        });

        it('marks a mutation as failed at the retry limit', async () => {
            service.registerHandler('CreateExercise', async () => {
                throw new Error('network');
            });
            rows = [buildMutation({ id: 'm-1', retryCount: 2 })];

            await service.processQueue();

            expect(store.update).toHaveBeenCalledWith('m-1', { status: 'failed', retryCount: 3 });
        });

        it('fails a mutation that has no registered handler', async () => {
            rows = [buildMutation({ id: 'm-unknown', operationName: 'Whatever' })];

            await service.processQueue();

            expect(console.warn).toHaveBeenCalled();
            expect(store.update).toHaveBeenCalledWith('m-unknown', {
                status: 'pending',
                retryCount: 1,
            });
        });
    });

    describe('retryFailed', () => {
        it('replays a specific mutation on success', async () => {
            service.registerHandler('CreateExercise', async () => true);
            rows = [buildMutation({ id: 'm-1' })];

            await service.retryFailed('m-1');

            expect(store.update).toHaveBeenCalledWith('m-1', { status: 'syncing' });
            expect(store.delete).toHaveBeenCalledWith('m-1');
        });

        it('does nothing for an unknown id', async () => {
            await service.retryFailed('missing');

            expect(store.update).not.toHaveBeenCalled();
        });
    });

    describe('reconnect effect', () => {
        it('processes the queue automatically when back online', fakeAsync(() => {
            online.value = true;

            TestBed.inject(ApplicationRef).tick();
            flushMicrotasks();

            expect(store.where).toHaveBeenCalledWith('status');
        }));
    });
});
