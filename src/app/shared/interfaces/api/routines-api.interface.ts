import { Exercise, ExerciseCategory } from '../exercise.interface';
import { KindType } from '../routines.interface';

export interface RoutinePlanAPI {
    id: string;
    name: string;
    description: string;
    weekly_distribution?: string;
    routineDays?: RoutineDayAPI[];
    isFavorite?: boolean;
    createdBy?: string;
    isAiGenerated?: boolean | null;
    generatedFromPlanId?: string | null;
}

export interface RoutineDayAPI {
    id: string;
    title: string;
    isFavorite?: boolean;
    exercises?: { exercise: Exercise; order: number }[];
    kind: KindType;
    category: ExerciseCategory[];
}
