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
    retryCount?: number;
}

export interface AuthUser {
    id: string; // Will use 'current'
    userId: string;
    name: string;
    avatar: string;
    email: string;
    role: string;
}

export class WaveFitDB extends Dexie {
    graphqlCache!: Table<GraphqlCache, string>;
    pendingMutations!: Table<PendingMutation, string>;
    authUser!: Table<AuthUser, string>;
    exercises!: Table<any, string>;
    routines!: Table<any, string>;
    plans!: Table<any, string>;
    tracking!: Table<any, string>;

    constructor() {
        super('WaveFitDB');
        // Define schemas
        this.version(2).stores({
            graphqlCache: 'cacheKey', // Primary key
            pendingMutations: 'id, operationName, status', // Primary key and indexes
            authUser: 'id', // Primary key
        });

        this.version(3).stores({
            exercises: 'id',
            routines: 'id',
            plans: 'id',
            tracking: 'id',
        });
    }
}

@Injectable({ providedIn: 'root' })
export class IndexedDbStorageService {
    db: WaveFitDB;

    constructor() {
        this.db = new WaveFitDB();
    }

    async saveExercises(exercises: any[]): Promise<void> {
        try {
            await this.db.exercises.clear();
            await this.db.exercises.bulkPut(exercises);
        } catch (error) {
            console.error('Error saving exercises to IndexedDB', error);
        }
    }

    async saveRoutines(routines: any[]): Promise<void> {
        try {
            await this.db.routines.clear();
            await this.db.routines.bulkPut(routines);
        } catch (error) {
            console.error('Error saving routines to IndexedDB', error);
        }
    }

    async savePlan(plan: any): Promise<void> {
        try {
            if (!plan.id) return;
            await this.db.plans.put(plan);
        } catch (error) {
            console.error('Error saving plan to IndexedDB', error);
        }
    }

    async saveTrackings(trackings: any[]): Promise<void> {
        try {
            await this.db.tracking.bulkPut(trackings);
        } catch (error) {
            console.error('Error saving trackings to IndexedDB', error);
        }
    }

    async saveTracking(tracking: any): Promise<void> {
        try {
            if (!tracking.id) return;
            await this.db.tracking.put(tracking);
        } catch (error) {
            console.error('Error saving tracking to IndexedDB', error);
        }
    }
}
