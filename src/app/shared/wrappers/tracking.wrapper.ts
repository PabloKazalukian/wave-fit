import {
    DayStatusAPI,
    ExercisePerformanceAPI,
    TrackingAPI,
    WorkoutSessionAPI,
    WeekLogDayAPI,
    UpdateWeekLogDayInput,
    UpdateWeekLogInput,
} from '../interfaces/api/tracking-api.interface';
import {
    ExercisePerformanceVM,
    StatusWorkoutSession,
    StatusWorkoutSessionEnum,
    TrackingVM,
    TrackingVMS,
    WorkoutSessionVM,
    WeekLogDayVM,
} from '../interfaces/tracking.interface';
import { Exercise, ExerciseCategory } from '../interfaces/exercise.interface';
import { ExtraSessionForm } from '../components/widgets/extra-session/extra-session-form/extra-session-form';

export function wrapperTrackingApiToVMS(
    payload: TrackingAPI,
    allExercises: Exercise[],
): TrackingVMS {
    return {
        id: payload.id,
        userId: payload.userId,
        startDate: new Date(payload.startDate),
        endDate: new Date(payload.endDate),
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
        startDate: new Date(payload.startDate),
        endDate: new Date(payload.endDate),
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
        date: new Date(payload.date),
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
    !payload.exercises || payload.exercises.length === 0
        ? (status = StatusWorkoutSessionEnum.NOT_STARTED)
        : (status = StatusWorkoutSessionEnum.COMPLETE);

    return {
        id: payload.id,
        date: payload.date ? new Date(payload.date) : new Date(),
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
        date: payload.date,
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

// export function wrapperExtraSessionToUpdateWeekLogDayInput(
//     payload: ExtraSessionForm,
//     status: DayStatusAPI,
//     order: number,
// ): UpdateWeekLogDayInput {
//     return {
//         extraSessionId: payload.id,
//         status,
//         order,
//     };
// }

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
        date: new Date(payload.date),
        exercises: wrapperExercisePerformanceApiToVM(payload.exercises || [], allExercises),
        status: payload.isRest
            ? StatusWorkoutSessionEnum.REST
            : wrapperDayStatusApiToStatusWorkoutSession(payload.status),
        extras: payload.extraSessionIds ?? [],
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
            extraSessionIds: [],
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
