import { ExercisePerformanceVM, LocalDate } from './tracking.interface';

export type DayStatusVM = 'pending' | 'complete' | 'skipped';

/**
 * ViewModel del DayLog activo.
 * Modelo FLAT (a diferencia del WeekLog que anida days[]): el day-log tiene un
 * único workout (WS global) + sesiones extra + status a nivel de raíz.
 * date es LocalDate "yyyy-MM-dd" — nunca Date.
 */
export interface DayLogVM {
    id: string;
    userId: string;
    date: LocalDate; // "yyyy-MM-dd"
    planId?: string | null;
    routineDayId?: string | null;
    workoutSessionId?: string;
    exercises?: ExercisePerformanceVM[];
    extraSessionIds: string[];
    status: DayStatusVM;
    active: boolean;
    completed: boolean;
    notes?: string;
}

/**
 * Resultado de la query `ActiveTracking` (fuente de verdad de arranque).
 * type indica qué contenedor está activo ("WEEK_LOG" | "DAY_LOG").
 */
export type ActiveTrackingType = 'WEEK_LOG' | 'DAY_LOG';

export interface ActiveTrackingVM {
    hasActive: boolean;
    type: ActiveTrackingType;
    week?: ActiveWeekVM | null;
    day?: ActiveDayVM | null;
}

export interface ActiveWeekVM {
    id: string;
    startDate: LocalDate;
    endDate: LocalDate;
    completed: boolean;
    active: boolean;
}

export interface ActiveDayVM {
    id: string;
    date: LocalDate;
    completed: boolean;
    active: boolean;
    status: DayStatusVM;
}

/** Item del histórico day-log (query DayLogs). */
export interface DayLogSummaryVM {
    id: string;
    date: LocalDate;
    completed: boolean;
    active: boolean;
    status: DayStatusVM;
}
