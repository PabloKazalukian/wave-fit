import { CreateExtraSessionWithoutWsInput, ExercisePerformanceAPI, LocalDate } from './tracking-api.interface';

export type DayStatusAPI = 'pending' | 'complete' | 'skipped';

/** Payload para crear un DayLog. date es LocalDate; timezone obligatorio. */
export interface CreateDayLogInput {
    date: LocalDate; // "yyyy-MM-dd"
    timezone: string; // IANA, ej: "America/Argentina/Buenos_Aires"
    planId?: string;
    routineDayId?: string;
    notes?: string;
}

/** Payload para cerrar/completar un DayLog o actualizarlo (unificado, un solo día). */
export interface UpdateDayLogInput {
    id: string;
    completed?: boolean;
    notes?: string;
    extraSession?: CreateExtraSessionWithoutWsInput;
}

/** Respuesta completa de API para un DayLog (CreateDayLog / DayLog). Fechas ISO de Mongo. */
export interface DayLogAPI {
    id: string;
    userId?: string;
    date: string; // ISO string de Mongo (se convierte a LocalDate en wrapper)
    planId?: string | null;
    routineDayId?: string | null;
    workoutSessionId?: string;
    exercises?: ExercisePerformanceAPI[];
    extraSessionIds: string[];
    status: DayStatusAPI;
    active: boolean;
    completed: boolean;
    notes?: string;
}

/** Item de listado histórico (query DayLogs). */
export interface DayLogSummaryAPI {
    id: string;
    date: string;
    completed: boolean;
    active: boolean;
    status: DayStatusAPI;
}

//──────────── ActiveTracking (fuente de verdad de arranque) ────────────

export type ActiveTrackingTypeAPI = 'WEEK_LOG' | 'DAY_LOG';

export interface ActiveTrackingAPI {
    hasActive: boolean;
    type: ActiveTrackingTypeAPI;
    week?: ActiveWeekAPI | null;
    day?: ActiveDayAPI | null;
}

export interface ActiveWeekAPI {
    id: string;
    startDate: string; // ISO de Mongo
    endDate: string; // ISO de Mongo
    completed: boolean;
    active: boolean;
}

export interface ActiveDayAPI {
    id: string;
    date: string; // ISO de Mongo
    completed: boolean;
    active: boolean;
    status: DayStatusAPI;
}

//──────────── Retornos parciales de mutations day-log ────────────

/** Retorno de UpdateDayLog: { id active completed notes extraSessionIds } */
export interface UpdateDayLogResultAPI {
    id: string;
    active?: boolean;
    completed?: boolean;
    notes?: string;
    extraSessionIds?: string[];
}

/** Retorno de UpdateDayLogStatus: { id status workoutSessionId active } */
export interface UpdateDayLogStatusResultAPI {
    id: string;
    status?: DayStatusAPI;
    workoutSessionId?: string | null;
    active?: boolean;
}

/** Retorno de AssignRoutineToDayLog: { id routineDayId workoutSessionId exercises } */
export interface AssignRoutineToDayLogResultAPI {
    id: string;
    routineDayId?: string | null;
    workoutSessionId?: string | null;
    exercises?: ExercisePerformanceAPI[];
}

/** Retorno de RemoveWorkoutSessionFromDayLog: { id workoutSessionId status } */
export interface RemoveWorkoutSessionFromDayLogResultAPI {
    id: string;
    workoutSessionId?: string | null;
    status?: DayStatusAPI;
}

/** Retorno de RemoveExtraSessionFromDayLog: { id extraSessionIds } */
export interface RemoveExtraSessionFromDayLogResultAPI {
    id: string;
    extraSessionIds?: string[];
}
