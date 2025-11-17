export enum ExerciseCategory {
    CHEST = 'chest',
    BACK = 'back',
    LEGS = 'legs',
    LEGS_FRONT = 'legs_front',
    LEGS_POSTERIOR = 'legs_posterior',
    BICEPS = 'biceps',
    TRICEPS = 'triceps',
    SHOULDERS = 'shoulders',
    CORE = 'core',
    CARDIO = 'cardio',
}

export interface Exercise {
    id?: string;
    name: string;
    description?: string;
    category: ExerciseCategory;
    usesWeight: boolean;
}
