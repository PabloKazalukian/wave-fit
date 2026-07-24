import { inject, Injectable } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { map, Observable, tap } from 'rxjs';
import { Apollo } from 'apollo-angular';
import { handleGraphqlError } from '../../../shared/utils/handle-graphql-error';
import { GENERATE_PLAN, GET_TRAINING_PLAN, GET_TRAINING_PLANS } from '../../apollo/coach.query';
import {
    TrainingPlanListItem,
    TrainingPlanDetail,
} from '../../../shared/interfaces/coach.interface';

@Injectable({
    providedIn: 'root',
})
export class CoachService {
    private readonly apollo = inject(Apollo);

    authSvc = inject(AuthService);

    generatePlan(): Observable<TrainingPlanDetail | null> {
        return this.apollo
            .mutate<{ generatePlan: TrainingPlanDetail }>({
                mutation: GENERATE_PLAN,
            })
            .pipe(
                tap({ next: (data) => console.log('GENERATE_PLAN', data) }),
                handleGraphqlError(this.authSvc),
                map(({ data }) => (data?.generatePlan ? data.generatePlan : null)),
            );
    }

    getPlanTrackings(): Observable<TrainingPlanListItem[] | null> {
        return this.apollo
            .query<{ trainingPlans: TrainingPlanListItem[] }>({
                query: GET_TRAINING_PLANS,
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                tap({ next: (data) => console.log('GET_TRAINING_PLANS', data) }),
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
                tap({ next: (data) => console.log('GET_TRAINING_PLAN', data) }),
                map(({ data }) => (data?.trainingPlan ? data.trainingPlan : null)),
            );
    }
}
