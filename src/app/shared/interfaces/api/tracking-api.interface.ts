import { StatusWorkoutSession } from '../tracking.interface';

export interface TrackingCreate {
    startDate: Date;
    endDate: Date;
    planId?: string;
    notes?: string;
    completed?: boolean;
}
export interface TrackingAPI {
    id: string;
    userId: string;
    startDate: Date;
    endDate: Date;
    workouts?: WorkoutSessionAPI[];
    extras?: ExtraSessionAPI[];
    planId?: string; // plan elegido esa semana
    notes?: string;
    completed: boolean;
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
