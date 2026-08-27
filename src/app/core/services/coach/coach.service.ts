import { inject, Injectable } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { map, Observable } from 'rxjs';
import { Apollo } from 'apollo-angular';
import { handleGraphqlError } from '../../../shared/utils/handle-graphql-error';
import {
    CONFIRM_PLAN,
    GENERATE_PLAN,
    GET_TRAINING_PLAN,
    GET_TRAINING_PLANS,
    REMOVE_TRAINING_PLAN,
} from '../../apollo/coach.query';
import { GET_AI_USAGE_STATUS } from '../../apollo/ai-usage.query';
import {
    AiUsageStatus,
    TrainingPlanDetail,
    TrainingPlansPage,
    ConfirmPlanOutput,
    PlanConfirmationAction,
} from '../../../shared/interfaces/coach.interface';

@Injectable({
    providedIn: 'root',
})
export class CoachService {
    private readonly apollo = inject(Apollo);

    authSvc = inject(AuthService);

    generatePlan(comment: string = ''): Observable<TrainingPlanDetail | null> {
        return this.apollo
            .mutate<{ generatePlan: TrainingPlanDetail }>({
                mutation: GENERATE_PLAN,
                variables: { comment },
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                map(({ data }) => (data?.generatePlan ? data.generatePlan : null)),
            );
    }

    getPlanTrainings(limit: number, offset: number): Observable<TrainingPlansPage | null> {
        return this.apollo
            .query<{ trainingPlans: TrainingPlansPage }>({
                query: GET_TRAINING_PLANS,
                variables: { limit, offset },
                fetchPolicy: 'network-only',
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                map(({ data }) => (data?.trainingPlans ? data.trainingPlans : null)),
            );
    }

    getPlanTrainingById(id: string): Observable<TrainingPlanDetail | null> {
        return this.apollo
            .query<{ trainingPlan: TrainingPlanDetail }>({
                query: GET_TRAINING_PLAN,
                variables: { id },
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                map(({ data }) => (data?.trainingPlan ? data.trainingPlan : null)),
            );
    }

    removePlantraningById(id: string): Observable<TrainingPlanDetail | null> {
        return this.apollo
            .mutate<{ removePlan: TrainingPlanDetail }>({
                mutation: REMOVE_TRAINING_PLAN,
                variables: { id },
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                map(({ data }) => (data?.removePlan ? data.removePlan : null)),
            );
    }

    confirmPlan(id: string, action: PlanConfirmationAction): Observable<ConfirmPlanOutput | null> {
        return this.apollo
            .mutate<{ confirmPlan: ConfirmPlanOutput }>({
                mutation: CONFIRM_PLAN,
                variables: { id, action },
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                map(({ data }) => (data?.confirmPlan ? data.confirmPlan : null)),
            );
    }

    getAiUsageStatus(): Observable<AiUsageStatus | null> {
        return this.apollo
            .query<{ aiUsageStatus: AiUsageStatus }>({
                query: GET_AI_USAGE_STATUS,
                fetchPolicy: 'network-only',
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                map(({ data }) => (data?.aiUsageStatus ? data.aiUsageStatus : null)),
            );
    }
}
