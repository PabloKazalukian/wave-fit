export interface RoutinePlanAPI {
    id: string;
    name: string;
    description: string;
    weekly_distribution?: string;
    routineDays?: string[];
    createdBy?: string;
}
