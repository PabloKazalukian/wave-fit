import { AiPlanResponse } from './ai-plan.interface';

export interface TrainingPlanListItem {
    id: string;
    title: string;
    focus: string;
    status: string;
    durationWeeks: number;
    trainingDaysPerWeek: number;
    createdAt: string;
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
}
