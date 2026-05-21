import { Injectable, signal, effect, inject } from '@angular/core';
import { NetworkStatusService } from '../network/network-status.service';
import { IndexedDbStorageService, PendingMutation } from '../storage/indexed-db.service';

@Injectable({ providedIn: 'root' })
export class SyncQueueService {
    private networkSvc = inject(NetworkStatusService);
    private idb = inject(IndexedDbStorageService);

    // Signal pública: número de mutations pendientes
    pendingCount = signal<number>(0);

    // Sistema de registro de handlers para evitar dependencias circulares
    private handlers: Map<string, (mutation: PendingMutation) => Promise<any>> = new Map();

    constructor() {
        effect(() => {
            if (this.networkSvc.isOnline()) {
                this.processQueue();
            }
        });
        this.updatePendingCount();

        // Escuchar mensajes desde el Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'PROCESS_SYNC_QUEUE') {
                    console.log('Background Sync trigger recibido desde SW');
                    this.processQueue();
                }
            });
        }
    }

    async updatePendingCount() {
        const count = await this.idb.db.pendingMutations.count();
        this.pendingCount.set(count);
    }

    registerHandler(operationName: string, handler: (mutation: PendingMutation) => Promise<any>) {
        this.handlers.set(operationName, handler);
    }

    // Encolar una mutation
    async enqueue(mutation: PendingMutation): Promise<void> {
        await this.idb.db.pendingMutations.put(mutation);
        this.pendingCount.update(c => c + 1);
        
        // Registrar para background sync si está disponible
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
            try {
                const swRegistration = await navigator.serviceWorker.ready;
                await (swRegistration as any).sync.register('sync-mutations');
            } catch (err) {
                console.error('Background Sync no soportado o falló', err);
            }
        }
    }

    // Remover de la cola (éxito)
    async dequeue(id: string): Promise<void> {
        await this.idb.db.pendingMutations.delete(id);
        this.pendingCount.update(c => Math.max(0, c - 1));
    }

    // Procesar cola pendiente
    async processQueue(): Promise<void> {
        const pending = await this.idb.db.pendingMutations
            .where('status')
            .anyOf('pending', 'failed')
            .toArray();

        // Ordenamos por createdAt
        pending.sort((a, b) => a.createdAt - b.createdAt);

        for (const mutation of pending) {
            await this.replay(mutation);
        }
    }

    // Reintentar una mutation específica
    async retryFailed(id: string): Promise<void> {
        const mutation = await this.idb.db.pendingMutations.get(id);
        if (mutation) await this.replay(mutation);
    }

    private async replay(mutation: PendingMutation): Promise<void> {
        await this.idb.db.pendingMutations.update(mutation.id, { status: 'syncing' });

        try {
            // Ejecutar la mutation GraphQL correspondiente
            const result = await this.executeMutation(mutation);

            if (result) {
                await this.dequeue(mutation.id);
                // La conciliación se puede delegar al propio handler
            }
        } catch (error) {
            console.error(`Error procesando mutation ${mutation.id}`, error);
            const record = await this.idb.db.pendingMutations.get(mutation.id);
            const retryCount = (record?.retryCount || 0) + 1;
            const maxRetries = 3;

            if (retryCount >= maxRetries) {
                await this.idb.db.pendingMutations.update(mutation.id, {
                    status: 'failed',
                    retryCount,
                });
            } else {
                await this.idb.db.pendingMutations.update(mutation.id, {
                    status: 'pending',
                    retryCount,
                });
            }
        }
    }

    private async executeMutation(mutation: PendingMutation): Promise<any> {
        const handler = this.handlers.get(mutation.operationName);
        if (handler) {
            return await handler(mutation);
        } else {
            console.warn(`No handler registered for operation: ${mutation.operationName}`);
            throw new Error(`No handler registered for operation: ${mutation.operationName}`);
        }
    }
}
