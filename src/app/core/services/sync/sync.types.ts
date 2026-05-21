export interface Syncable {
    id: string;
    version: number;          // Para optimistic locking
    updatedAt: string;        // ISO timestamp
    syncStatus: 'synced' | 'pending' | 'failed' | 'conflict';
    pendingSync: boolean;
}

export type MutationEvent =
    | { type: 'ADD_SET'; exerciseId: string; setIndex: number; reps: number; weight: number }
    | { type: 'REMOVE_SET'; exerciseId: string; setIndex: number }
    | { type: 'UPDATE_WEIGHT'; exerciseId: string; setIndex: number; weight: number }
    | { type: 'UPDATE_REPS'; exerciseId: string; setIndex: number; reps: number }
    | { type: 'FINISH_WORKOUT'; date: string }
    | { type: 'ADD_EXERCISE'; exerciseId: string }
    | { type: 'REMOVE_EXERCISE'; exerciseId: string };

export type ExerciseEvent =
    | { type: 'CREATE_EXERCISE'; payload: any }
    | { type: 'UPDATE_EXERCISE'; payload: any }
    | { type: 'DELETE_EXERCISE'; exerciseId: string };

export type RoutineEvent =
    | { type: 'CREATE_ROUTINE_DAY'; payload: any }
    | { type: 'UPDATE_ROUTINE_DAY'; id: string; payload: any }
    | { type: 'DELETE_ROUTINE_DAY'; id: string };

export type PlanEvent =
    | { type: 'CREATE_PLAN'; payload: any }
    | { type: 'UPDATE_PLAN'; id: string; payload: any };
