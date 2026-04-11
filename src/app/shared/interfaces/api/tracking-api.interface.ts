import { StatusWorkoutSession } from '../tracking.interface';
export type DayStatusAPI = 'pending' | 'complete' | 'skipped';

export interface TrackingCreate {
    startDate: Date;
    endDate: Date;
    planId?: string;
    notes?: string;
    completed?: boolean;
}

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

export interface WeekLogDayAPI {
    order: number; // 1–7
    date: string; // ISO string desde Mongo
    isRest: boolean;
    workoutSessionId?: string | null;
    exercises?: ExercisePerformanceAPI[];
    extraSessionIds: string[];
    status: DayStatusAPI;
}

//───────────────────────────────────────────────────────

export interface UpdateWeekLogInput {
    id: string;
    startDate?: string;
    endDate?: string;
    userId?: string;
    planId?: string;
    days?: UpdateWeekLogDayInput[];
    completed?: boolean;
    active?: boolean;
    notes?: string;
}

export interface UpdateWeekLogDayInput {
    order: number;
    isRest?: boolean;
    workoutSessionId?: string;
    workoutSession?: UpdateWorkoutSessionInput;
    extraSessionIds?: string[];
    extraSessions?: ExtraSessionAPI[];
    status?: 'pending' | 'complete' | 'skipped';
}

export interface UpdateWorkoutSessionInput {
    id?: string;
    weekLogId?: string;
    date?: string;
    routineDayId?: string;
    exercises?: ExercisePerformanceAPI[];
    status?: StatusWorkoutSession;
    notes?: string;
    edited?: boolean;
}

// plan-tracking.domain.interfaces.ts

export interface CreateExtraSessionWithoutWsInput {
    date: string;
    discipline: string;
    duration: number;
    intensityLevel: number;
    calories?: number;
    notes?: string;
}

// Reemplaza el UpdateWeekLogDayInput legacy
export interface UpdateDayInput {
    order: number;
    isRest?: boolean;
    workoutSessionId?: string;
    workoutSession?: UpdateWorkoutSessionInput;
    extraSession?: CreateExtraSessionWithoutWsInput;
    status?: string;
}

// Input principal que espera el back
export interface UpdateWeekLogDayUnifiedInput {
    id: string; // weekLogId
    days: UpdateDayInput[];
}
