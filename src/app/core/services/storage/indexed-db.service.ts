import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';

export interface GraphqlCache {
    cacheKey: string;
    data: any;
    updatedAt: number;
}

export interface PendingMutation {
    id: string; // The UUID generated offline
    operationName: string;
    variables: any;
    status: 'pending' | 'syncing' | 'failed';
    createdAt: number;
}

export interface AuthUser {
    id: string; // Will use 'current'
    userId: string;
    name: string;
    email: string;
    role: string;
}

export class WaveFitDB extends Dexie {
    graphqlCache!: Table<GraphqlCache, string>;
    pendingMutations!: Table<PendingMutation, string>;
    authUser!: Table<AuthUser, string>;

    constructor() {
        super('WaveFitDB');
        // Define schemas
        this.version(2).stores({
            graphqlCache: 'cacheKey', // Primary key
            pendingMutations: 'id, operationName, status', // Primary key and indexes
            authUser: 'id' // Primary key
        });
    }
}

@Injectable({ providedIn: 'root' })
export class IndexedDbStorageService {
    db: WaveFitDB;

    constructor() {
        this.db = new WaveFitDB();
    }
}
