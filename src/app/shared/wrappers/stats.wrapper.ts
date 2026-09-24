import { ExerciseCategory } from '../interfaces/exercise.interface';
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
