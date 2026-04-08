export interface ExtraSessionDisciplineConfig {
    key: string;
    label: string;
    category: ExtraSessionCategory;
    avgCaloriesPerHour: number;
}

export enum ExtraSessionCategory {
    CARDIO = 'CARDIO',
    STRENGTH = 'STRENGTH',
    SPORT = 'SPORT',
    MIND_BODY = 'MIND_BODY',
}

export interface ExtraSession {
    id: string;
    userId: string;
    workoutSessionId: string;
    category: ExtraSessionCategory;
    discipline: string;
    date: string | Date;
    duration: number;
    intensityLevel: number;
    calories?: number;
    notes?: string;
}

export interface CreateExtraSessionInput {
    workoutSessionId: string;
    date: string;
    discipline: string;
    duration: number;
    intensityLevel: number;
    calories?: number;
    notes?: string;
}

export interface UpdateExtraSessionInput {
    id: string;
    discipline?: string;
    date?: string;
    duration?: number;
    intensityLevel?: number;
    calories?: number;
    notes?: string;
}
