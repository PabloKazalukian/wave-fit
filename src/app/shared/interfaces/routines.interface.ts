import { Exercise, ExerciseCategory } from './exercise.interface';

export type DayIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface RoutineSummary {
    id: string;
    title: string;
    type: string; // ex: "CHEST", "LEGS", ...
    durationMinutes?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
}

export interface DayPlan {
    day: DayIndex;
    kind: 'REST' | 'WORKOUT';
    workoutType?: string; // ex: "CHEST"
    routineId?: string;
    expanded?: boolean;
}

export interface RoutinePlan {
    name: string;
    description: string;
    weekly_distribution: string;
    routineDays: string[];
    createdBy?: string;
}

export interface RoutineDay {
    id: string;
    title: string;
    type?: ExerciseCategory[];
    exercises?: Exercise[];
    planId?: string;
}

export interface RoutineDayCreate {
    title: string;
    type?: ExerciseCategory[] | string[];
    exercises?: Exercise[];
    planId?: string;
}

export interface RoutineDayCreateSend {
    title: string;
    type?: ExerciseCategory[] | string[];
    exercises?: string[];
    planId?: string;
}
