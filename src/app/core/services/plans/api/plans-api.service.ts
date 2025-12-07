import { Injectable } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { Apollo, gql } from 'apollo-angular';
import { RoutinePlan, RoutinePlanCreate } from '../../../../shared/interfaces/routines.interface';
import { handleGraphqlError } from '../../../../shared/utils/handle-graphql-error';
import { tap } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class PlansApiService {
    constructor(
        private apollo: Apollo,
        private authSvc: AuthService,
    ) {}

    getPlans() {
        return this.apollo.query({
            query: gql`
                query {
                    plans {
                        id
                        name
                        description
                        duration
                    }
                }
            `,
            fetchPolicy: 'no-cache',
        });
    }

    createPlan(planInput: RoutinePlanCreate) {
        return this.apollo
            .mutate<{ CreatePlan: RoutinePlan }>({
                mutation: gql`
                    mutation CreatePlan($input: CreatePlanInput!) {
                        createPlan(createPlanInput: $input) {
                            id
                            name
                            description
                        }
                    }
                `,
                variables: { input: planInput },
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                tap((value) => console.log(value)),
            );
    }
}
