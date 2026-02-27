import { ExerciseCategory } from './exercise.interface';

export type StatusWorkoutSession = 'not_started' | 'complete' | 'rest';
export enum StatusWorkoutSessionEnum {
    NOT_STARTED = 'not_started',
    REST = 'rest',
    COMPLETE = 'complete',
}

export interface TrackingVM {
    id: string;
    userId: string;
    startDate: Date;
    endDate: Date;
    workouts?: WorkoutSessionVM[];
    extras?: ExtraActivityVM[];
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
    duration?: number; // minutos
    distance?: number; // km
}
