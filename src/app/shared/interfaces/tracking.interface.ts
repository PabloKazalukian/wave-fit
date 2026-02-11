export type StatusWorkoutSession = 'not_started' | 'in_progress' | 'sent';
export enum StatusWorkoutSessionEnum {
    NOT_STARTED = 'not_started',
    IN_PROGRESS = 'in_progress',
    SENT = 'sent',
}
export interface TrackingCreate {
    startDate: Date;
    endDate: Date;
    planId?: string;
    notes?: string;
    completed?: boolean;
}

export interface Tracking {
    id: string;
    userId: string;
    startDate: Date;
    endDate: Date;
    workouts?: WorkoutSession[];
    extras?: ExtraSession[];
    planId?: string; // plan elegido esa semana
    notes?: string;
    completed: boolean;
}

export interface WorkoutSessionVM {
    id?: string;
    date: Date;
    exercises: ExercisePerformanceVM[];
    status: StatusWorkoutSession;
    notes?: string;
}

export interface TrackingVM {
    id: string;
    userId: string;
    startDate: Date;
    endDate: Date;
    workouts?: WorkoutSessionVM[];
    extras?: ExtraSession[];
    planId?: string; // plan elegido esa semana
    notes?: string;
    completed: boolean;
}

export interface WeekLogCacheVM {
    weekId: string;
    userId: string;
    lastUpdated: Date;
}

export interface ExtraActivityVM {
    id: string;
    type: 'running' | 'yoga' | 'cycling' | 'other';
    duration?: number; // minutos
    distance?: number; // km
}

export interface ExercisePerformanceVM {
    exerciseId: string;
    name: string;
    // series: number;
    notes?: string;
}

export interface ExtraSession {
    id: string;
    type: string; // "cardio", "yoga", "deporte", etc.
    discipline: string; // "running", "bicicleta", "fútbol", etc.
    duration: number; // en minutos
    intensityLevel: number; // escala 1–5
    calories?: number;
    notes?: string;
}

export interface WorkoutSession {
    id: string;
    date?: Date;
    routineDayId?: string; // referencia al día del plan (si siguió uno)
    exercises?: ExercisePerformance[];
    notes?: string;
}

export interface ExercisePerformance {
    exerciseId: string; // referencia al Exercise
    // weights?: number[]; // pesos usados por serie
    // reps: number[]; // repeticiones por serie
    notes?: string;
}
