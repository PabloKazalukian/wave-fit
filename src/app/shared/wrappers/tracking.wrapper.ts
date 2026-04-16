import { formatInTimeZone } from 'date-fns-tz';
import {
    DayStatusAPI,
    ExercisePerformanceAPI,
    TrackingAPI,
    WorkoutSessionAPI,
    WeekLogDayAPI,
    UpdateWeekLogDayInput,
} from '../interfaces/api/tracking-api.interface';
import {
    ExercisePerformanceVM,
    LocalDate,
    StatusWorkoutSession,
    StatusWorkoutSessionEnum,
    TrackingVM,
    TrackingVMS,
    WorkoutSessionVM,
    WeekLogDayVM,
} from '../interfaces/tracking.interface';
import { Exercise, ExerciseCategory } from '../interfaces/exercise.interface';

/**
 * Convierte una fecha de la API (ISO string de MongoDB) a LocalDate "yyyy-MM-dd".
 * Usa la timezone del usuario para evitar off-by-one en UTC-X.
 */
function apiDateToLocalDate(isoString: string): LocalDate {
    // MongoDB devuelve ISO UTC (ej: "2024-04-16T03:00:00.000Z")
    // formatInTimeZone lo convierte a la fecha correcta en la TZ del usuario
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return formatInTimeZone(new Date(isoString), timezone, 'yyyy-MM-dd');
}

export function wrapperTrackingApiToVMS(
    payload: TrackingAPI,
    allExercises: Exercise[],
): TrackingVMS {
    return {
        id: payload.id,
        userId: payload.userId,
        startDate: apiDateToLocalDate(payload.startDate), // ✅ ISO → LocalDate
        endDate: apiDateToLocalDate(payload.endDate),
        planId: payload.planId,
        notes: payload.notes,
        completed: payload.completed,
        days: payload.days?.map((d) => wrapperWeekLogDayApiToVM(d, allExercises)) ?? [],
        workouts: payload.days?.map((d) => wrapperWeekLogDayVMToWorkoutVM(d, allExercises)) ?? [],
    };
}

export function wrapperTrackingApiToVM(payload: TrackingAPI, allExercises: Exercise[]): TrackingVM {
    return {
        id: payload.id,
        userId: payload.userId,
        startDate: apiDateToLocalDate(payload.startDate), // ✅ ISO → LocalDate
        endDate: apiDateToLocalDate(payload.endDate),
        planId: payload.planId,
        notes: payload.notes,
        completed: payload.completed,
        workouts: payload.days.map((d) => wrapperWeekLogDayVMToWorkoutVM(d, allExercises)),
    };
}

export function wrapperWeekLogDayApiToVM(
    payload: WeekLogDayAPI,
    allExercises: Exercise[],
): WeekLogDayVM {
    return {
        order: payload.order,
        date: apiDateToLocalDate(payload.date), // ✅ ISO → LocalDate
        isRest: payload.isRest,
        workoutSessionId: payload.workoutSessionId ?? null,
        exercises: wrapperExercisePerformanceApiToVM(payload.exercises || [], allExercises),
        extraSessionIds: payload.extraSessionIds ?? [],
        status: payload.status,
    };
}

export function wrapperWorkoutSessionApiToVM(
    payload: WorkoutSessionAPI,
    allExercises: Exercise[],
): WorkoutSessionVM {
    let status: StatusWorkoutSessionEnum;
    if (!payload.exercises || payload.exercises.length === 0) {
        status = StatusWorkoutSessionEnum.NOT_STARTED;
    } else {
        status = StatusWorkoutSessionEnum.COMPLETE;
    }

    // Si no hay date, usar hoy como LocalDate (via browser TZ)
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const today = formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd');

    return {
        id: payload.id,
        date: payload.date ?? today, // ya es LocalDate "yyyy-MM-dd"
        exercises: wrapperExercisePerformanceApiToVM(payload.exercises || [], allExercises),
        status,
        notes: payload.notes,
    };
}

export function wrapperWorkoutSessionVMToApi(
    payload: WorkoutSessionVM,
    trackingId: string,
): WorkoutSessionAPI {
    return {
        id: payload.id,
        weekLogId: trackingId,
        date: payload.date, // ✅ ya es LocalDate — sin conversión
        exercises: wrapperExercisePerformanceVMToApi(payload.exercises),
        status: payload.status,
        notes: payload.notes,
    };
}

export function wrapperWorkoutToUpdateWeekLogDayInput(
    payload: WorkoutSessionVM,
    status: DayStatusAPI,
    order: number,
): UpdateWeekLogDayInput {
    return {
        workoutSessionId: payload.id,
        status,
        order,
    };
}

export function wrapperExercisePerformanceVMToApi(
    payload: ExercisePerformanceVM[],
): ExercisePerformanceAPI[] {
    return payload.map((e) => ({
        exerciseId: e.exerciseId,
        series: e.series,
        sets: e.sets.map((s) => ({
            reps: s.reps,
            weights: s.weights,
        })),
        notes: e.notes,
    }));
}

export function wrapperExercisePerformanceApiToVM(
    payload: ExercisePerformanceAPI[],
    allExercises: Exercise[],
): ExercisePerformanceVM[] {
    if (payload.length === 0) return [];

    const exercisesMap = new Map(allExercises.map((ex) => [ex.id, ex]));

    return payload.map((performance) => {
        const exercise = exercisesMap.get(performance.exerciseId);
        const name = exercise?.name || 'Ejercicio desconocido';
        const usesWeight = exercise?.usesWeight || false;
        const category = exercise?.category || ExerciseCategory.CARDIO;

        return {
            exerciseId: performance.exerciseId,
            name,
            category,
            series: performance.series,
            sets: performance.sets.map((set) => ({
                reps: set.reps,
                weights: set.weights,
            })),
            usesWeight,
            notes: performance.notes,
        };
    });
}

export function wrapperWeekLogDayVMToWorkoutVM(
    payload: WeekLogDayAPI,
    allExercises: Exercise[],
): WorkoutSessionVM {
    return {
        id: payload.workoutSessionId ?? '',
        date: apiDateToLocalDate(payload.date), // ✅ ISO → LocalDate
        exercises: wrapperExercisePerformanceApiToVM(payload.exercises || [], allExercises),
        status: payload.isRest
            ? StatusWorkoutSessionEnum.REST
            : wrapperDayStatusApiToStatusWorkoutSession(payload.status),
        extras: payload.extraSessionIds ?? [],
        notes: '',
    };
}

export function wrapperWeekLogDayVMToWorkoutSessionVM(payload: WeekLogDayVM): WorkoutSessionVM {
    return {
        id: payload.workoutSessionId ?? '',
        date: payload.date, // ✅ ya es LocalDate
        exercises: payload.exercises,
        status: payload.isRest
            ? StatusWorkoutSessionEnum.REST
            : wrapperDayStatusApiToStatusWorkoutSession(payload.status as DayStatusAPI),
        extras: payload.extraSessionIds,
        notes: '',
    };
}

export function wrapperDayStatusApiToStatusWorkoutSession(
    payload: DayStatusAPI,
): StatusWorkoutSession {
    switch (payload) {
        case 'pending':
            return StatusWorkoutSessionEnum.NOT_STARTED;
        case 'complete':
            return StatusWorkoutSessionEnum.COMPLETE;
        case 'skipped':
            return StatusWorkoutSessionEnum.REST;
    }
}

export function wrapperWorkoutSessionVMtoUpdateWeekLogDayInput(
    workouts: WorkoutSessionVM[],
): UpdateWeekLogDayInput[] {
    return (workouts ?? []).map((w, i) => {
        const isRest = w.status === StatusWorkoutSessionEnum.REST;
        return {
            order: i + 1,
            workoutSessionId: w.id ?? undefined,
            isRest: isRest,
            status: w.id ? 'complete' : isRest ? 'skipped' : 'pending',
        };
    });
}

export function emptyDay(
    workoutDays: UpdateWeekLogDayInput[],
    totalDays: number,
): UpdateWeekLogDayInput[] {
    return Array.from({ length: totalDays }, (_, i) => {
        const order = i + 1;
        const existing = workoutDays.find((d) => d.order === order);
        return existing ?? { order, status: 'skipped', extraSessionIds: [] };
    });
}
