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
