import { apiDateTimeToLocalDate } from '../utils/date.utils';
import { translateExerciseCategory } from '../utils/exercise-category.utils';
import { normalizeStatsCategory } from './stats.wrapper';
import {
    CaloriesWeekAPI,
    ExerciseTrendAPI,
    ForgottenMuscleAPI,
    OneRmExerciseAPI,
    OneRmWeekAPI,
    VolumeTotalWeekAPI,
    VolumeWeekAPI,
    VolumeWeekExerciseAPI,
    VolumeWeekMuscleAPI,
} from '../interfaces/api/stats-charts-api.interface';
import {
    CaloriesWeekVM,
    ExerciseTrendVM,
    ForgottenMuscleVM,
    OneRmExerciseVM,
    OneRmWeekVM,
    TrendLabelVM,
    VolumeTotalWeekVM,
    VolumeWeekExerciseVM,
    VolumeWeekMuscleVM,
    VolumeWeekVM,
} from '../interfaces/stats-charts.interface';

/**
 * API → VM del namespace `stats-charts`.
 *
 * Dos reglas atraviesan todo el wrapper:
 *
 * 1. Un número nullable nunca se coercea a 0. El backend codifica "no hay dato"
 *    con `null` y un `0` lo convertiría en "entrenó y no levantó nada", que es
 *    otra cosa (y además rompería los gaps de los gráficos).
 * 2. Una categoría o músculo desconocido no se descarta: se conserva el valor
 *    crudo y se traduce con el fallback de capitalización. El enum del frontend
 *    tiene 10 miembros y el backend 11.
 */

function round1(value: number): number {
    return Math.round(value * 10) / 10;
}

function roundInt(value: number): number {
    return Math.round(value);
}

/** Redondea solo si hay valor; `null` se propaga. */
function round1OrNull(value: number | null): number | null {
    return value == null ? null : round1(value);
}

function roundIntOrNull(value: number | null): number | null {
    return value == null ? null : roundInt(value);
}

const TREND_LABELS: readonly TrendLabelVM[] = ['UP', 'FLAT', 'DOWN', 'INSUFFICIENT'];

/** Una etiqueta desconocida se degrada a INSUFFICIENT: no se inventa dirección. */
function narrowTrendLabel(label: string): TrendLabelVM {
    return TREND_LABELS.includes(label as TrendLabelVM) ? (label as TrendLabelVM) : 'INSUFFICIENT';
}

// 1RM

function wrapperOneRmWeekApiToVM(api: OneRmWeekAPI): OneRmWeekVM {
    return {
        weekKey: api.weekKey,
        best1RM: round1OrNull(api.best1RM),
        weightUsed: round1OrNull(api.weightUsed),
        reps: roundIntOrNull(api.reps),
        participated: api.participated,
    };
}

export function wrapperOneRmExerciseApiToVM(api: OneRmExerciseAPI): OneRmExerciseVM {
    return {
        exerciseId: api.exerciseId,
        name: api.name,
        category: normalizeStatsCategory(api.category),
        weeks: (api.weeks ?? []).map(wrapperOneRmWeekApiToVM),
    };
}

export function wrapperStats1RmWeeklyToVM(api: OneRmExerciseAPI[] | null): OneRmExerciseVM[] {
    return (api ?? []).map(wrapperOneRmExerciseApiToVM);
}

// Volumen

function wrapperVolumeWeekExerciseApiToVM(api: VolumeWeekExerciseAPI): VolumeWeekExerciseVM {
    return {
        exerciseId: api.exerciseId,
        name: api.name,
        category: normalizeStatsCategory(api.category),
        volume: round1(api.volume),
    };
}

function wrapperVolumeWeekMuscleApiToVM(api: VolumeWeekMuscleAPI): VolumeWeekMuscleVM {
    return {
        muscle: api.muscle,
        label: translateExerciseCategory(api.muscle),
        sets: api.sets,
        volume: round1(api.volume),
    };
}

export function wrapperVolumeWeekApiToVM(api: VolumeWeekAPI): VolumeWeekVM {
    return {
        weekKey: api.weekKey,
        exercises: (api.exercises ?? []).map(wrapperVolumeWeekExerciseApiToVM),
        muscles: (api.muscles ?? []).map(wrapperVolumeWeekMuscleApiToVM),
    };
}

export function wrapperStatsVolumeWeeklyToVM(api: VolumeWeekAPI[] | null): VolumeWeekVM[] {
    return (api ?? []).map(wrapperVolumeWeekApiToVM);
}

// Volumen total

export function wrapperVolumeTotalWeekApiToVM(api: VolumeTotalWeekAPI): VolumeTotalWeekVM {
    return {
        weekKey: api.weekKey,
        totalVolume: round1(api.totalVolume),
        deltaPct: roundIntOrNull(api.deltaPct),
        possibleDeload: api.possibleDeload,
    };
}

export function wrapperStatsVolumeTotalWeeklyToVM(
    api: VolumeTotalWeekAPI[] | null,
): VolumeTotalWeekVM[] {
    return (api ?? []).map(wrapperVolumeTotalWeekApiToVM);
}

// Calorías

function wrapperCaloriesWeekApiToVM(api: CaloriesWeekAPI): CaloriesWeekVM {
    return {
        weekKey: api.weekKey,
        // Siempre null: el backend no lo estima y el frontend tampoco (FR-015).
        routineKcal: roundIntOrNull(api.routineKcal),
        extraKcal: roundInt(api.extraKcal),
        totalKcal: roundInt(api.totalKcal),
        estimatedSessions: api.estimatedSessions,
    };
}

export function wrapperStatsCaloriesWeeklyToVM(api: CaloriesWeekAPI[] | null): CaloriesWeekVM[] {
    return (api ?? []).map(wrapperCaloriesWeekApiToVM);
}

// Músculos olvidados

export function wrapperForgottenMuscleApiToVM(
    api: ForgottenMuscleAPI,
    timezone?: string,
): ForgottenMuscleVM {
    return {
        muscle: api.muscle,
        label: translateExerciseCategory(api.muscle),
        totalSets: api.totalSets,
        weeksWithoutWork: api.weeksWithoutWork,
        lastTrainedAt:
            api.lastTrainedAt == null ? null : apiDateTimeToLocalDate(api.lastTrainedAt, timezone),
    };
}

export function wrapperStatsForgottenMusclesToVM(
    api: ForgottenMuscleAPI[] | null,
    timezone?: string,
): ForgottenMuscleVM[] {
    return (api ?? []).map((item) => wrapperForgottenMuscleApiToVM(item, timezone));
}

// Tendencia por ejercicio

export function wrapperExerciseTrendApiToVM(api: ExerciseTrendAPI): ExerciseTrendVM {
    return {
        exerciseId: api.exerciseId,
        name: api.name,
        category: normalizeStatsCategory(api.category),
        slope: round1OrNull(api.slope),
        pctChange: roundIntOrNull(api.pctChange),
        label: narrowTrendLabel(api.label as string),
        weeksUsed: api.weeksUsed,
    };
}

export function wrapperStatsExerciseTrendToVM(api: ExerciseTrendAPI[] | null): ExerciseTrendVM[] {
    return (api ?? []).map(wrapperExerciseTrendApiToVM);
}
