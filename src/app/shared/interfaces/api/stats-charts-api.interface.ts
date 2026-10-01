import type { LocalDate } from '../local-date.interface';

/**
 * Respuestas de wave-fit-api para el namespace `stats-charts`.
 *
 * A diferencia de `stats-api.interface.ts` (snapshots pre-computados por el
 * worker), estas seis queries se agregan **on demand** para el rango pedido.
 * Los campos vienen tal cual los expone presentation/entities/*.output.ts
 * (stats-charts.resolver.ts).
 *
 * Regla transversal: todo número nullable se queda en `null`. Coercionarlo a 0
 * borraría los gaps que el backend codifica (p. ej. `participated: false`).
 */

/** Compartida por las seis queries; se envía como `variables: { input }`. */
export interface StatsChartsInput {
    from: LocalDate; // "yyyy-MM-dd"
    to: LocalDate; // "yyyy-MM-dd"
    timezone?: string; // default "America/Argentina/Buenos_Aires"
}

// 1. getStats1RmWeekly(input: StatsChartsInput!): OneRmExerciseAPI[]

export interface OneRmWeekAPI {
    weekKey: string; // "2026-W40"
    best1RM: number | null; // null cuando la semana no tiene set elegible
    weightUsed: number | null;
    reps: number | null;
    participated: boolean; // false → el chart muestra un gap
}

export interface OneRmExerciseAPI {
    exerciseId: string;
    name: string;
    category: string; // ExerciseCategory en UPPERCASE (BR-004)
    weeks: OneRmWeekAPI[];
}

// 2. getStatsVolumeWeekly(input: StatsChartsInput!): VolumeWeekAPI[]

export interface VolumeWeekExerciseAPI {
    exerciseId: string;
    name: string;
    category: string; // UPPERCASE (BR-004)
    volume: number; // reps × weights
}

export interface VolumeWeekMuscleAPI {
    muscle: string; // valor de ExerciseCategory, p. ej. "chest"
    sets: number;
    volume: number;
}

export interface VolumeWeekAPI {
    weekKey: string;
    exercises: VolumeWeekExerciseAPI[];
    muscles: VolumeWeekMuscleAPI[];
}

// 3. getStatsVolumeTotalWeekly(input: StatsChartsInput!): VolumeTotalWeekAPI[]

export interface VolumeTotalWeekAPI {
    weekKey: string;
    totalVolume: number;
    deltaPct: number | null; // contra la semana anterior de la serie
    possibleDeload: boolean; // true cuando deltaPct <= -30
}

// 4. getStatsCaloriesWeekly(input: StatsChartsInput!): CaloriesWeekAPI[]

export interface CaloriesWeekAPI {
    weekKey: string;
    routineKcal: number | null; // SIEMPRE null — el frontend nunca lo completa
    extraKcal: number;
    totalKcal: number; // === extraKcal
    estimatedSessions: number; // estimado por MET; excluye sesiones manuales
}

// 5. getStatsForgottenMuscles(input: StatsChartsInput!): ForgottenMuscleAPI[]

export interface ForgottenMuscleAPI {
    muscle: string; // valor crudo del enum, p. ej. "chest" (puede incluir "rest")
    totalSets: number;
    weeksWithoutWork: number;
    lastTrainedAt: string | null; // DateTime ISO
}

// 6. getStatsExerciseTrend(input: StatsChartsInput!): ExerciseTrendAPI[]

export type TrendLabelAPI = 'UP' | 'FLAT' | 'DOWN' | 'INSUFFICIENT';

export interface ExerciseTrendAPI {
    exerciseId: string;
    name: string;
    category: string; // UPPERCASE (BR-004)
    slope: number | null; // regresión lineal sobre el 1RM semanal
    pctChange: number | null;
    label: TrendLabelAPI;
    weeksUsed: number;
}
