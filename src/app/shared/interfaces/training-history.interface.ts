import type { ExercisePerformanceVM } from './tracking.interface';
import type { ExtraSession } from './extra-session.interface';

export enum CalendarDayType {
    WEEK_LOG = 'WEEK_LOG',
    DAY_LOG = 'DAY_LOG',
}

export enum TrainingStatus {
    PENDING = 'pending',
    COMPLETE = 'complete',
    SKIPPED = 'skipped',
    REST = 'rest',
    NONE = 'none',
}

export interface WeekLogReference {
    id: string;
    startDate: string; // LocalDate "yyyy-MM-dd"
    endDate: string;
    completed: boolean;
    active: boolean;
    notes?: string;
}

export interface CalendarDay {
    date: string; // "yyyy-MM-dd"
    type: CalendarDayType;
    status: TrainingStatus;
    workoutSessionId?: string;
    extraSessionIds?: string[];
    extraSessions?: ExtraSession[];
    dayLogId?: string;
    weekLogReference?: WeekLogReference | null;
}

export interface TrainingCalendarResponse {
    year: number;
    month: number;
    days: CalendarDay[];
}

export interface TrainingCalendarInput {
    year: number;
    month: number;
    timezone?: string;
}

export interface DayPreview {
    kind: CalendarDayType.WEEK_LOG | CalendarDayType.DAY_LOG;
    id: string; // weekLogReference.id (WEEK_LOG) or dayLogId (DAY_LOG); '' (empty) for extras-only day-logs without a dayLogId → hides the header CTA (FR-011)
    date: string; // LocalDate "yyyy-MM-dd"
    exercises: ExercisePerformanceVM[];
    extraSessions: ExtraSession[]; // always present; [] when the day has none (FR-011)
    active?: boolean; // solo para WEEK_LOG: si es la semana activa
}
