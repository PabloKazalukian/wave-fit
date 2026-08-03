export type AiPlanFocus =
    | 'hypertrophy'
    | 'strength'
    | 'endurance'
    | 'fat_loss'
    | 'maintenance'
    | 'recomp'
    | 'sport_specific';

// Estructura real que devuelve el backend (days en la raíz)
export interface AiPlanExercise {
    exerciseId: string;
    name: string;
    plannedSets: number;
    plannedReps: string;
    rpe?: number | null;
    restSeconds?: number | null;
    notes?: string | null;
}

export interface AiPlanDay {
    order: number;
    isRest: boolean;
    focus: string | null;
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
