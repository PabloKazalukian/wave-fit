import { ExerciseCategory } from './exercise.interface';

export type LocalDate = string; // "yyyy-MM-dd"
export type DayStatusVM = 'pending' | 'complete' | 'skipped';

export interface WeekLogDayVM {
    order: number;
    date: LocalDate; // "yyyy-MM-dd" — nunca Date
    isRest: boolean;
    workoutSessionId?: string | null;
    exercises: ExercisePerformanceVM[];
    extraSessionIds: string[];
    status: DayStatusVM;
}

export type StatusWorkoutSession = 'not_started' | 'complete' | 'rest' | 'edited';
export enum StatusWorkoutSessionEnum {
    NOT_STARTED = 'not_started',
    REST = 'rest',
    COMPLETE = 'complete',
    EDITED = 'edited',
}

/**
 * ViewModel del WeekLog / Tracking activo.
 * startDate/endDate son LocalDate "yyyy-MM-dd" para comparaciones determinísticas.
 */
export interface TrackingVM {
    id: string;
    userId: string;
    startDate: LocalDate; // "yyyy-MM-dd"
    endDate: LocalDate;   // "yyyy-MM-dd"
    workouts?: WorkoutSessionVM[];
    planId?: string | null;
    notes?: string;
    completed: boolean;
}

export interface TrackingVMS {
    id: string;
    userId: string;
    startDate: LocalDate; // "yyyy-MM-dd"
    endDate: LocalDate;   // "yyyy-MM-dd"
    planId?: string | null;
    days: WeekLogDayVM[];
    completed: boolean;
    notes?: string;
    workouts?: WorkoutSessionVM[];
    extras?: string[];
}

/**
 * ViewModel de una sesión de entrenamiento.
 * date es LocalDate "yyyy-MM-dd" — nunca Date object.
 */
export interface WorkoutSessionVM {
    id?: string;
    date: LocalDate; // "yyyy-MM-dd"
    exercises: ExercisePerformanceVM[];
    extras?: string[];
    status: StatusWorkoutSession;
    notes?: string;
    planId?: string;
}

export interface ExercisePerformanceVM {
    exerciseId: string;
    name: string;
    series: number;
    category: ExerciseCategory;
    sets: {
        reps: number;
        weights?: number;
    }[];
    usesWeight: boolean;
    notes?: string;
}

export interface ExtraActivityVM {
    id: string;
    type: 'running' | 'yoga' | 'cycling' | 'other';
    duration?: number;
    distance?: number;
}
