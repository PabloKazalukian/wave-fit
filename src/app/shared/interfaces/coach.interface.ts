import { AiPlanResponse } from './ai-plan.interface';
import { RoutinePlanAPI } from './api/routines-api.interface';

export interface AiUsageStatus {
    used: number;
    limit: number;
    remaining: number;
    resetAt: string;
}

export type PlanConfirmationAction =
    | 'CREATE_WEEK_LOG'
    | 'CREATE_ROUTINE_PLAN'
    | 'ADAPT_ACTIVE_WEEK';

export interface TrainingPlanListItem {
    id: string;
    title: string;
    focus: string;
    status: string;
    durationWeeks?: number;
    trainingDaysPerWeek?: number;
    confirmed?: boolean;
    createdAt: string;
}

export interface TrainingPlansPage {
    items: TrainingPlanListItem[];
    total: number;
    limit: number;
    offset: number;
    totalPages: number;
}

export interface AiSnapshot {
    modelUsed: string;
    tokensUsed: number;
    rawResponse: AiPlanResponse | string;
}

export interface TrainingPlanDetail {
    id: string;
    title: string;
    description: string | null;
    focus: string;
    status: string;
    startDate: string;
    endDate: string;
    durationWeeks: number;
    trainingDaysPerWeek: number;
    tags: string[];
    aiSnapshot: AiSnapshot;
    confirmed?: boolean;
    confirmedAction?: PlanConfirmationAction | null;
    resultingWeekLogId?: string | null;
    resultingRoutinePlanId?: string | null;
    version?: number;
}

export interface ConfirmedTrainingPlan {
    id: string;
    title: string;
    confirmed?: boolean;
    status?: string;
    confirmedAction?: PlanConfirmationAction | null;
    resultingWeekLogId?: string | null;
    resultingRoutinePlanId?: string | null;
}

export interface WeekLogDayResult {
    order: number;
    date: string;
    isRest: boolean;
    workoutSessionId?: string | null;
    exercises: {
        exerciseId: string;
        series: number;
    }[];
}

export interface WeekLogResult {
    id: string;
    startDate: string;
    endDate: string;
    days: WeekLogDayResult[];
}

export interface ConfirmPlanOutput {
    trainingPlan: ConfirmedTrainingPlan;
    weekLog: WeekLogResult | null;
    routinePlan: RoutinePlanAPI | null;
}
