import { inject, Injectable } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { map, Observable } from 'rxjs';
import { Apollo } from 'apollo-angular';
import { handleGraphqlError } from '../../../shared/utils/handle-graphql-error';
import { GENERATE_PLAN, GET_TRAINING_PLAN, GET_TRAINING_PLANS } from '../../apollo/coach.query';
import {
    TrainingPlanDetail,
    TrainingPlansPage,
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

    getPlanTrackings(limit: number, offset: number): Observable<TrainingPlansPage | null> {
        return this.apollo
            .query<{ trainingPlans: TrainingPlansPage }>({
                query: GET_TRAINING_PLANS,
                variables: { limit, offset },
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                map(({ data }) => (data?.trainingPlans ? data.trainingPlans : null)),
            );
    }

    getPlanTrackingById(id: string): Observable<TrainingPlanDetail | null> {
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
}
