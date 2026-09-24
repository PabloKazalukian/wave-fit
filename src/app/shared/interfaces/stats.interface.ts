import type { ExerciseCategory } from './exercise.interface';
import type { LocalDate } from './api/stats-api.interface';

export type StatsCategory = ExerciseCategory | 'unknown';

export interface TopExerciseVM {
    rank: number;
    exerciseId: string;
    name: string;
    category: StatsCategory;
    totalSessions: number;
    totalVolume: number;
    avgVolumePerSession: number;
}

export interface TopRoutineVM {
    rank: number;
    planId: string;
    name: string;
    totalWeeks: number;
    totalSessions: number;
    adherenceRate: number; // porcentaje
}

export interface PersonalRecordVM {
    exerciseId: string;
    exerciseName: string;
    category: StatsCategory;
    oneRmEstimated: number;
    bestWeight: number;
    bestReps: number;
    bestVolume: number;
    achievedAt: LocalDate; // "yyyy-MM-dd"
    previousOneRm: number | null; // null → primer registro (FR-007)
}

export interface AdherenceWeekVM {
    weekStartDate: LocalDate; // "yyyy-MM-dd"
    totalDays: number;
    completedDays: number;
    skippedDays: number;
    pendingDays: number;
    adherencePercent: number; // 0..100
}

// ── Contenedores por query (mismos campos en el VM) ──────

export interface TopExercisesVM {
    id: string;
    userId: string;
    computedAt: string; // DateTime ISO
    exercises: TopExerciseVM[];
}

export interface TopRoutinesVM {
    id: string;
    userId: string;
    computedAt: string; // DateTime ISO
    routines: TopRoutineVM[];
}

export interface PersonalRecordsVM {
    id: string;
    userId: string;
    computedAt: string; // DateTime ISO
    records: PersonalRecordVM[];
}

export interface AdherenceVM {
    id: string;
    userId: string;
    computedAt: string; // DateTime ISO
    weeks: AdherenceWeekVM[];
}

/**
 * Un registro es "nuevo PR" cuando no había 1RM previo o el estimado actual
 * supera al anterior (FR-007).
 */
export function isNewRecord(record: PersonalRecordVM): boolean {
    if (record.previousOneRm == null) return true;
    return record.oneRmEstimated > record.previousOneRm;
}
