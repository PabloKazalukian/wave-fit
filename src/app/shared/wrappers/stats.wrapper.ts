import { ExerciseCategory } from '../interfaces/exercise.interface';
import { RoutinePlanAPI } from '../interfaces/api/routines-api.interface';
import {
    AdherenceStatsAPI,
    PersonalRecordAPI,
    PersonalRecordsStatsAPI,
    TopExerciseAPI,
    TopExercisesStatsAPI,
    TopRoutineAPI,
    TopRoutinesStatsAPI,
} from '../interfaces/api/stats-api.interface';
import {
    AdherenceVM,
    PersonalRecordVM,
    PersonalRecordsVM,
    StatsCategory,
    TopExerciseVM,
    TopExercisesVM,
    TopRoutineVM,
    TopRoutinesVM,
} from '../interfaces/stats.interface';

const CATEGORY_VALUES: string[] = Object.values(ExerciseCategory);

export function normalizeStatsCategory(raw: string): StatsCategory {
    const lowered = raw.toLowerCase();
    return CATEGORY_VALUES.includes(lowered) ? (lowered as StatsCategory) : 'unknown';
}

function round1(value: number): number {
    return Math.round(value * 10) / 10;
}

function roundInt(value: number): number {
    return Math.round(value);
}

export function wrapperTopExerciseApiToVM(api: TopExerciseAPI): TopExerciseVM {
    return {
        rank: api.rank,
        exerciseId: api.exerciseId,
        name: api.name,
        category: normalizeStatsCategory(api.category),
        totalSessions: api.totalSessions,
        totalVolume: round1(api.totalVolume),
        avgVolumePerSession: round1(api.avgVolumePerSession),
    };
}

export function wrapperTopExercisesApiToVM(api: TopExercisesStatsAPI): TopExercisesVM {
    return {
        id: api.id,
        userId: api.userId,
        computedAt: api.computedAt,
        exercises: (api.exercises ?? []).map(wrapperTopExerciseApiToVM),
    };
}

export function wrapperTopRoutineApiToVM(api: TopRoutineAPI): TopRoutineVM {
    return {
        rank: api.rank,
        planId: api.planId,
        name: api.name,
        totalWeeks: api.totalWeeks,
        totalSessions: api.totalSessions,
        adherenceRate: roundInt(api.adherenceRate),
    };
}

export function wrapperTopRoutinesApiToVM(api: TopRoutinesStatsAPI): TopRoutinesVM {
    return {
        id: api.id,
        userId: api.userId,
        computedAt: api.computedAt,
        routines: (api.routines ?? []).map(wrapperTopRoutineApiToVM),
    };
}

/**
 * El snapshot de `topRoutines` guarda el nombre del plan copiado por el worker.
 * Ese nombre puede haber quedado sin resolver (planes globales no viajan en
 * `getRawDataForWorker`), así que se prefiere el nombre del catálogo vivo de
 * `routinePlans` y solo se recurre al del snapshot cuando el `planId` no
 * resuelve. No se compara contra el texto literal del worker: no es un contrato.
 */
export function resolveRoutineNames(
    routines: TopRoutineVM[],
    plans?: Pick<RoutinePlanAPI, 'id' | 'name'>[] | null,
): TopRoutineVM[] {
    if (!plans?.length) return [...routines];

    const names = new Map<string, string>();
    for (const plan of plans) {
        if (plan.name) names.set(plan.id, plan.name);
    }
    if (names.size === 0) return [...routines];

    return routines.map((routine) => {
        const live = names.get(routine.planId);
        return live === undefined ? routine : { ...routine, name: live };
    });
}

export function wrapperPersonalRecordApiToVM(api: PersonalRecordAPI): PersonalRecordVM {
    return {
        exerciseId: api.exerciseId,
        exerciseName: api.exerciseName,
        category: normalizeStatsCategory(api.category),
        oneRmEstimated: round1(api.oneRmEstimated),
        bestWeight: round1(api.bestWeight),
        bestReps: api.bestReps,
        bestVolume: round1(api.bestVolume),
        achievedAt: api.achievedAt,
        previousOneRm: api.previousOneRm == null ? null : round1(api.previousOneRm),
    };
}

export function wrapperPersonalRecordsApiToVM(api: PersonalRecordsStatsAPI): PersonalRecordsVM {
    return {
        id: api.id,
        userId: api.userId,
        computedAt: api.computedAt,
        records: (api.records ?? []).map(wrapperPersonalRecordApiToVM),
    };
}

export function wrapperAdherenceApiToVM(api: AdherenceStatsAPI): AdherenceVM {
    return {
        id: api.id,
        userId: api.userId,
        computedAt: api.computedAt,
        weeks: (api.weeks ?? []).map((week) => ({
            weekStartDate: week.weekStartDate,
            totalDays: week.totalDays,
            completedDays: week.completedDays,
            skippedDays: week.skippedDays,
            pendingDays: week.pendingDays,
            adherencePercent: roundInt(week.adherencePercent),
        })),
    };
}
