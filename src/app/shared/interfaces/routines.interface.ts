import { Exercise, ExerciseCategory } from './exercise.interface';

export type DayIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type KindType = 'REST' | 'WORKOUT';
export enum KindEnum {
    rest = 'REST',
    workout = 'WORKOUT',
}

export interface DayPlan {
    day: DayIndex;
    kind: KindType | null;
    workoutType?: string; // ex: "CHEST"
    routineId?: string;
    expanded?: boolean;
}

export interface RoutinePlan {
    id?: string;
    name: string;
    description: string;
    weekly_distribution: string;
    routineDays: RoutineDay[];
    createdBy?: string;
}

export interface RoutinePlanCreate {
    name: string;
    description: string;
    weekly_distribution?: string;
    routineDays: RoutineDayCreate[];
    createdBy?: string;
}

export interface RoutineDay {
    id: string;
    title: string;
    type?: ExerciseCategory[];
    exercises?: Exercise[];
    planId?: string;
    kind: KindType;
}

export interface RoutineDayCreate {
    id?: string;
    kind?: KindType;
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

export interface CreateRoutinePlanInput {
    name: string;
    description: string;
    weekly_distribution: string;
    createdBy: string;
    routineDays: any;
}
