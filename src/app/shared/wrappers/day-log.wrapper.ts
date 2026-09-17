import { formatInTimeZone } from 'date-fns-tz';
import {
    ActiveDayAPI,
    ActiveTrackingAPI,
    ActiveWeekAPI,
    DayLogAPI,
    DayLogSummaryAPI,
    AssignRoutineToDayLogResultAPI,
    RemoveExtraSessionFromDayLogResultAPI,
    RemoveWorkoutSessionFromDayLogResultAPI,
    UpdateDayLogResultAPI,
    UpdateDayLogStatusResultAPI,
} from '../interfaces/api/day-log-api.interface';
import {
    ActiveDayVM,
    ActiveTrackingVM,
    ActiveWeekVM,
    DayLogSummaryVM,
    DayLogVM,
} from '../interfaces/day-log.interface';
import { wrapperExercisePerformanceApiToVM } from './tracking.wrapper';
import { Exercise } from '../interfaces/exercise.interface';

export function apiDateToLocalDate(isoString: string): string {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return formatInTimeZone(new Date(isoString), timezone, 'yyyy-MM-dd');
}

export function wrapperDayLogApiToVM(payload: DayLogAPI, allExercises: Exercise[]): DayLogVM {
    return {
        id: payload.id,
        userId: payload.userId ?? '',
        date: apiDateToLocalDate(payload.date), // ✅ ISO → LocalDate
        planId: payload.planId ?? null,
        routineDayId: payload.routineDayId ?? null,
        workoutSessionId: payload.workoutSessionId,
        exercises: wrapperExercisePerformanceApiToVM(payload.exercises || [], allExercises),
        extraSessionIds: payload.extraSessionIds ?? [],
        status: payload.status,
        active: payload.active,
        completed: payload.completed,
        notes: payload.notes,
    };
}

export function wrapperDayLogSummaryApiToVM(payload: DayLogSummaryAPI): DayLogSummaryVM {
    return {
        id: payload.id,
        date: apiDateToLocalDate(payload.date),
        completed: payload.completed,
        active: payload.active,
        status: payload.status,
    };
}

/**
 * Merge de un VM parcial (resultado de una mutation day-log) sobre el DayLogVM
 * actual. Devuelve un nuevo objeto sin mutar el original. Si no hay base devuelve
 * el parcial tipado como DayLogVM.
 */
export function patchDayLog(current: DayLogVM | null, partial: Partial<DayLogVM>): DayLogVM | null {
    if (!current) {
        if (partial.id) {
            return { ...patchDayLogEmpty(), ...partial };
        }
        return null;
    }
    return { ...current, ...partial };
}

function patchDayLogEmpty(): DayLogVM {
    return {
        id: '',
        userId: '',
        date: '',
        planId: null,
        routineDayId: null,
        extraSessionIds: [],
        status: 'pending',
        active: false,
        completed: false,
    };
}

/** UpdateDayLog → { id status active completed workoutSessionId notes extraSessionIds exercises } */
export function wrapperUpdateDayLogApiToVM(
    payload: UpdateDayLogResultAPI | null,
    allExercises: Exercise[],
): Partial<DayLogVM> {
    if (!payload) return {};
    return {
        id: payload.id,
        status: payload.status,
        active: payload.active,
        completed: payload.completed,
        ...(payload.workoutSessionId !== undefined
            ? { workoutSessionId: payload.workoutSessionId ?? undefined }
            : {}),
        notes: payload.notes,
        ...(payload.extraSessionIds ? { extraSessionIds: payload.extraSessionIds } : {}),
        ...(payload.exercises
            ? { exercises: wrapperExercisePerformanceApiToVM(payload.exercises, allExercises) }
            : {}),
    };
}

/** UpdateDayLogStatus → { id status workoutSessionId active } */
export function wrapperUpdateDayLogStatusApiToVM(
    payload: UpdateDayLogStatusResultAPI | null,
): Partial<DayLogVM> {
    if (!payload) return {};
    return {
        id: payload.id,
        status: payload.status,
        workoutSessionId: payload.workoutSessionId ?? undefined,
        active: payload.active,
    };
}

/** AssignRoutineToDayLog → { id routineDayId workoutSessionId exercises } */
export function wrapperAssignRoutineToDayLogApiToVM(
    payload: AssignRoutineToDayLogResultAPI | null,
    allExercises: Exercise[],
): Partial<DayLogVM> {
    if (!payload) return {};
    return {
        id: payload.id,
        routineDayId: payload.routineDayId ?? null,
        workoutSessionId: payload.workoutSessionId ?? undefined,
        exercises: payload.exercises
            ? wrapperExercisePerformanceApiToVM(payload.exercises, allExercises)
            : undefined,
    };
}

/** RemoveWorkoutSessionFromDayLog → { id workoutSessionId status } + cleared exercises */
export function wrapperRemoveWorkoutSessionFromDayLogApiToVM(
    payload: RemoveWorkoutSessionFromDayLogResultAPI | null,
): Partial<DayLogVM> {
    if (!payload) return {};
    return {
        id: payload.id,
        workoutSessionId: payload.workoutSessionId ?? undefined,
        status: payload.status ?? 'pending',
        exercises: [],
    };
}

/** RemoveExtraSessionFromDayLog → { id extraSessionIds } */
export function wrapperRemoveExtraSessionFromDayLogApiToVM(
    payload: RemoveExtraSessionFromDayLogResultAPI | null,
): Partial<DayLogVM> {
    if (!payload) return {};
    return {
        id: payload.id,
        extraSessionIds: payload.extraSessionIds ?? [],
    };
}

export function wrapperActiveTrackingApiToVM(
    payload: ActiveTrackingAPI | null | undefined,
): ActiveTrackingVM {
    return {
        hasActive: payload?.hasActive ?? false,
        type: payload?.type ?? ('DAY_LOG' as ActiveTrackingVM['type']),
        week: wrapperActiveWeekApiToVM(payload?.week),
        day: wrapperActiveDayApiToVM(payload?.day),
    };
}

export function wrapperActiveWeekApiToVM(
    payload: ActiveWeekAPI | null | undefined,
): ActiveWeekVM | null {
    if (!payload) return null;
    return {
        id: payload.id,
        startDate: apiDateToLocalDate(payload.startDate),
        endDate: apiDateToLocalDate(payload.endDate),
        completed: payload.completed,
        active: payload.active,
    };
}

export function wrapperActiveDayApiToVM(
    payload: ActiveDayAPI | null | undefined,
): ActiveDayVM | null {
    if (!payload) return null;
    return {
        id: payload.id,
        date: apiDateToLocalDate(payload.date),
        completed: payload.completed,
        active: payload.active,
        status: payload.status,
    };
}
