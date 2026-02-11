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

export interface ExerciseForm {
    name: string;
    description: string;
    category: ExerciseCategory | null;
    usesWeight: boolean;
}

export interface ExerciseTracking {
    id: string;
    name: string;
    category?: ExerciseCategory;
    usesWeight: boolean;
    series: number;
    sets?: {
        weights?: number;
        reps?: number;
    }[];
    reps: number;
    weight: number;
}
