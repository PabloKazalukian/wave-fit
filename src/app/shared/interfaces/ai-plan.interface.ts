export type AiPlanFocus =
    | 'hypertrophy'
    | 'strength'
    | 'endurance'
    | 'fat_loss'
    | 'maintenance'
    | 'recomp';

export interface AiPlanExercise {
    name: string;
    sets: number;
    reps: string;
    rpe?: number;
    restSeconds?: number;
    notes?: string;
}

export interface AiPlanDay {
    order: number;
    isRest: boolean;
    focus: string;
    exercises: AiPlanExercise[];
}

export interface AiPlanWeek {
    weekNumber: number;
    days: AiPlanDay[];
}

export interface AiPlanResponse {
    title: string;
    focus: AiPlanFocus;
    durationWeeks: number;
    daysPerWeek: number;
    weeks: AiPlanWeek[];
}
