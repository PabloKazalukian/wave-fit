import type { StatsChartsInput } from './api/stats-charts-api.interface';
import type { LocalDate } from './local-date.interface';
import type { StatsCategory } from './stats.interface';

// Re-exportado desde su ubicación canónica (BR-003) para que los consumidores
// de esta feature no tengan que saber dónde vive.
export type { LocalDateRange } from './local-date.interface';

/**
 * El Spec llama `StatsInsightsQueryInput` al input que el state emite y que las
 * seis queries reciben; la forma en sí se declara junto a la API. El alias deja
 * explícito que son el mismo tipo y no dos contratos.
 */
export type StatsInsightsQueryInput = StatsChartsInput;

export interface StatsDateRangePreset {
    label: string; // product language, p. ej. "Últimos 30 días"
    days: number;
}

/** Espeja el límite del backend; el widget, el state y los tests leen esta misma constante. */
export const STATS_INSIGHTS_MAX_RANGE_DAYS = 120;

export const STATS_INSIGHTS_DEFAULT_RANGE_DAYS = 30;

export const STATS_INSIGHTS_RANGE_PRESETS: readonly StatsDateRangePreset[] = [
    { label: 'Últimos 7 días', days: 7 },
    { label: 'Últimos 30 días', days: 30 },
    { label: 'Últimos 90 días', days: 90 },
    { label: 'Últimos 120 días', days: 120 },
];

export type StatsInsightsSection =
    | 'oneRm'
    | 'volume'
    | 'volumeTotal'
    | 'calories'
    | 'forgottenMuscles'
    | 'exerciseTrend';

/**
 * Una opción del selector "¿qué querés graficar?" (FR-022).
 *
 * `section` **es** la clave del query: el select es de una sola elección, así que
 * no hay traducción entre "lo que el usuario eligió" y "la sección que se
 * consulta". `label` es product language y es el mismo string que usa el título
 * de la card, para que el dropdown y el encabezado no puedan divergir.
 */
export interface StatsInsightsMetricOption {
    section: StatsInsightsSection;
    label: string;
}

// Caps del mapper — política de forma de dato, no preferencia del usuario.

export const STATS_INSIGHTS_MAX_1RM_SERIES = 6;

export const STATS_INSIGHTS_MAX_VOLUME_SERIES = 8;

export const STATS_INSIGHTS_OTHERS_SERIES_NAME = 'Otros';

// 1RM — espeja la API; los nulls se preservan, nunca se coercean a 0.

export interface OneRmWeekVM {
    weekKey: string;
    best1RM: number | null;
    weightUsed: number | null;
    reps: number | null;
    participated: boolean;
}

export interface OneRmExerciseVM {
    exerciseId: string;
    name: string;
    category: StatsCategory;
    weeks: OneRmWeekVM[];
}

// Volumen

export interface VolumeWeekExerciseVM {
    exerciseId: string;
    name: string;
    category: StatsCategory;
    volume: number;
}

export interface VolumeWeekMuscleVM {
    muscle: string;
    label: string; // traducido, resuelto en el wrapper
    sets: number;
    volume: number;
}

export interface VolumeWeekVM {
    weekKey: string;
    exercises: VolumeWeekExerciseVM[];
    muscles: VolumeWeekMuscleVM[];
}

// Volumen total

export interface VolumeTotalWeekVM {
    weekKey: string;
    totalVolume: number;
    deltaPct: number | null;
    possibleDeload: boolean;
}

// Calorías

export interface CaloriesWeekVM {
    weekKey: string;
    routineKcal: number | null; // siempre null; ver FR-015
    extraKcal: number;
    totalKcal: number;
    estimatedSessions: number;
}

// Músculos olvidados — `muscle` queda como string crudo (Correction 6).

export interface ForgottenMuscleVM {
    muscle: string;
    label: string;
    totalSets: number;
    weeksWithoutWork: number;
    lastTrainedAt: LocalDate | null; // DateTime → LocalDate en la timezone del usuario
}

// Tendencia por ejercicio

export type TrendLabelVM = 'UP' | 'FLAT' | 'DOWN' | 'INSUFFICIENT';

export interface ExerciseTrendVM {
    exerciseId: string;
    name: string;
    category: StatsCategory;
    slope: number | null;
    pctChange: number | null;
    label: TrendLabelVM;
    weeksUsed: number;
}
