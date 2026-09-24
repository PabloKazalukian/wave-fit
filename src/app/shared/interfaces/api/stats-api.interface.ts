export type LocalDate = string; // "yyyy-MM-dd"

/**
 * Respuestas de las estadísticas pre-computadas (worker).
 * Los campos vienen tal cual los expone wave-fit-api en
 * presentation/entities/*.output.ts (stats.resolver.ts).
 */

export interface TopExerciseAPI {
    rank: number;
    exerciseId: string;
    name: string;
    category: string; // ExerciseCategory en UPPERCASE (BR-004)
    totalSessions: number;
    totalVolume: number;
    avgVolumePerSession: number;
}

export interface TopRoutineAPI {
    rank: number;
    planId: string;
    name: string;
    totalWeeks: number;
    totalSessions: number;
    adherenceRate: number; // porcentaje
}

export interface PersonalRecordAPI {
    exerciseId: string;
    exerciseName: string;
    category: string; // ExerciseCategory en UPPERCASE (BR-004)
    oneRmEstimated: number;
    bestWeight: number;
    bestReps: number;
    bestVolume: number;
    achievedAt: LocalDate; // "yyyy-MM-dd"
    previousOneRm: number | null; // null → primer registro del ejercicio
}

export interface AdherenceWeekAPI {
    weekStartDate: LocalDate; // "yyyy-MM-dd"
    totalDays: number;
    completedDays: number;
    skippedDays: number;
    pendingDays: number;
    adherencePercent: number; // 0..100
}

// ── Contenedores por query ────────────────────────────────

export interface TopExercisesStatsAPI {
    id: string;
    userId: string;
    computedAt: string; // DateTime ISO
    exercises: TopExerciseAPI[];
}

export interface TopRoutinesStatsAPI {
    id: string;
    userId: string;
    computedAt: string; // DateTime ISO
    routines: TopRoutineAPI[];
}

export interface PersonalRecordsStatsAPI {
    id: string;
    userId: string;
    computedAt: string; // DateTime ISO
    records: PersonalRecordAPI[];
}

export interface AdherenceStatsAPI {
    id: string;
    userId: string;
    computedAt: string; // DateTime ISO
    weeks: AdherenceWeekAPI[];
}
