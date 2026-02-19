import { Exercise, ExerciseCategory, ExerciseSend } from './exercise.interface';

export type DayIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type KindType = 'REST' | 'WORKOUT';
export enum KindEnum {
    rest = 'REST',
    workout = 'WORKOUT',
}

export interface DayPlanCreate {
    expanded?: DayIndex;
}

export interface RoutinePlan {
    id?: string;
    name: string;
    description: string;
    weekly_distribution: string;
    routineDays: RoutineDay[];
    createdBy?: string;
}

export interface RoutinePlanVM {
    id?: string;
    name: string;
    description: string;
    weekly_distribution: string;
    routineDays: RoutineDayVM[];
    createdBy?: string;
}

export interface RoutinePlanCreate {
    name: string;
    description: string;
    weekly_distribution?: string;
    routineDays: RoutineDayCreate[];
    createdBy?: string;
}

export interface RoutinePlanSend {
    name: string;
    description: string;
    weekly_distribution: string;
    routineDays: string[] | null[];
    createdBy?: string;
}

//ROUTINE DAY INTERFACES
export interface RoutineDay {
    id: string;
    title: string;
    type?: ExerciseCategory[];
    exercises?: Exercise[];
    planId?: string;
    kind: KindType;
}

export interface RoutineDayVM {
    title?: string;
    type?: ExerciseCategory[];
    kind?: KindType;
    id?: string;
    expanded: boolean;
    day: DayIndex;
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
    exercises?: ExerciseSend[];
    planId?: string;
}

export interface CreateRoutinePlanInput {
    name: string;
    description: string;
    weekly_distribution: string;
    createdBy: string;
    routineDays: any;
}
