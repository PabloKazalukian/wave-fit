import { ExtraActivityVM, StatusWorkoutSession, WorkoutSessionVM } from '../tracking.interface';
export type DayStatusAPI = 'pending' | 'complete' | 'skipped';

export interface TrackingCreate {
    startDate: Date;
    endDate: Date;
    planId?: string;
    notes?: string;
    completed?: boolean;
}
// export interface TrackingAPI {
//     id: string;
//     userId: string;
//     startDate: Date;
//     endDate: Date;
//     workouts?: WorkoutSessionAPI[];
//     extras?: ExtraSessionAPI[];
//     planId?: string; // plan elegido esa semana
//     notes?: string;
//     completed: boolean;
// }
export interface WorkoutSessionAPI {
    id?: string;
    date?: Date;
    weekLogId?: string;
    status: StatusWorkoutSession;
    routineDayId?: string; // referencia al día del plan (si siguió uno)
    exercises?: ExercisePerformanceAPI[];
    notes?: string;
}
export interface ExercisePerformanceAPI {
    exerciseId: string; // referencia al Exercise
    sets: {
        reps: number;
        weights?: number;
    }[];
    series: number;
    notes?: string;
}

export interface ExtraSessionAPI {
    id: string;
    type: string; // "cardio", "yoga", "deporte", etc.
    discipline: string; // "running", "bicicleta", "fútbol", etc.
    duration: number; // en minutos
    intensityLevel: number; // escala 1–5
    calories?: number;
    notes?: string;
}

export interface WeekLogDayAPI {
    order: number; // 1–7
    date: string; // ISO string desde Mongo
    isRest: boolean;
    workoutSessionId?: string | null;
    extraSessionIds: string[];
    status: DayStatusAPI;
}

export interface TrackingAPI {
    id: string;
    userId: string;
    startDate: string;
    endDate: string;
    planId?: string | null;
    days: WeekLogDayAPI[];
    completed: boolean;
    notes?: string;
}

export type DayStatusVM = 'pending' | 'complete' | 'skipped';

export interface WeekLogDayVM {
    order: number;
    date: Date;
    isRest: boolean;
    workoutSessionId?: string | null;
    // Los exercises/extras se resuelven aparte si hace falta mostrarlos
    extraSessionIds: string[];
    status: DayStatusVM;
}

// ─── Input para update ───────────────────────────────────────────────────────

export interface UpdateWeekLogInput {
    id: string;
    startDate?: string;
    endDate?: string;
    planId?: string;
    days?: UpdateWeekLogDayInput[];
    completed?: boolean;
    notes?: string;
}

export interface UpdateWeekLogDayInput {
    order: number;
    workoutSessionId?: string;
    extraSessionIds?: string[];
    status?: 'pending' | 'complete' | 'skipped';
}
