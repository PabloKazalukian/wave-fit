import { Exercise, ExerciseCategory } from '../exercise.interface';
import { KindType } from '../routines.interface';

export interface RoutinePlanAPI {
    id: string;
    name: string;
    description: string;
    weekly_distribution?: string;
    routineDays?: string[];
    createdBy?: string;
}

export interface RoutineDayAPI {
    id: string;
    title: string;
    exercises?: { exercise: Exercise; order: number }[];
    kind: KindType;
    category: ExerciseCategory[];
}
