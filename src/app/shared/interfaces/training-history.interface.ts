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
