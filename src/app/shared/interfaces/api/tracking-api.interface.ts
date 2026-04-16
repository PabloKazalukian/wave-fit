import { StatusWorkoutSession } from '../tracking.interface';

export type LocalDate = string; // "yyyy-MM-dd"
export type DayStatusAPI = 'pending' | 'complete' | 'skipped';

/**
 * Payload para crear un WeekLog.
 * startDate/endDate son LocalDate "yyyy-MM-dd" — nunca Date ni ISO UTC.
 * timezone es obligatorio para que el backend convierta correctamente a UTC.
 */
export interface TrackingCreate {
    startDate: LocalDate;
    endDate: LocalDate;
    timezone: string; // IANA, ej: "America/Argentina/Buenos_Aires"
    planId?: string;
    notes?: string;
    completed?: boolean;
}

export interface WorkoutSessionAPI {
    id?: string;
    date?: LocalDate; // "yyyy-MM-dd"
    weekLogId?: string;
    status: StatusWorkoutSession;
    routineDayId?: string;
    exercises?: ExercisePerformanceAPI[];
    notes?: string;
}

export interface ExercisePerformanceAPI {
    exerciseId: string;
    sets: {
        reps: number;
        weights?: number;
    }[];
    series: number;
    notes?: string;
}

export interface ExtraSessionAPI {
    id: string;
    type: string;
    discipline: string;
    duration: number;
    intensityLevel: number;
    calories?: number;
    notes?: string;
}

/**
 * Respuesta de la API para un WeekLog completo.
 * Las fechas vienen como strings ISO de Mongo — se convierten a LocalDate en los wrappers.
 */
export interface TrackingAPI {
    id: string;
    userId: string;
    startDate: string; // ISO string de Mongo (se convierte a LocalDate en wrapper)
    endDate: string;
    planId?: string | null;
    days: WeekLogDayAPI[];
    completed: boolean;
    notes?: string;
}

export interface WeekLogDayAPI {
    order: number;
    date: string; // ISO string de Mongo (se convierte a LocalDate en wrapper)
    isRest: boolean;
    workoutSessionId?: string | null;
    exercises?: ExercisePerformanceAPI[];
    extraSessionIds: string[];
    status: DayStatusAPI;
}

//───────────────────────────────────────────────────────

export interface UpdateWeekLogInput {
    id: string;
    startDate?: LocalDate; // "yyyy-MM-dd"
    endDate?: LocalDate;   // "yyyy-MM-dd"
    timezone?: string;
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
    extraSession?: CreateExtraSessionWithoutWsInput;
    status?: 'pending' | 'complete' | 'skipped';
}

export interface UpdateWorkoutSessionInput {
    id?: string;
    weekLogId?: string;
    date?: LocalDate; // "yyyy-MM-dd"
    routineDayId?: string;
    exercises?: ExercisePerformanceAPI[];
    status?: StatusWorkoutSession;
    notes?: string;
    edited?: boolean;
}

export interface CreateExtraSessionWithoutWsInput {
    date: LocalDate; // "yyyy-MM-dd"
    discipline: string;
    duration: number;
    intensityLevel: number;
    calories?: number;
    notes?: string;
}

export interface UpdateDayInput {
    order: number;
    isRest?: boolean;
    workoutSessionId?: string;
    workoutSession?: UpdateWorkoutSessionInput;
    extraSession?: CreateExtraSessionWithoutWsInput;
    status?: string;
}

export interface UpdateWeekLogDayUnifiedInput {
    id: string; // weekLogId
    days: UpdateDayInput[];
}
