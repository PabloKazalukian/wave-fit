import { Injectable } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { Apollo, gql } from 'apollo-angular';
import {
    CreateRoutinePlanInput,
    RoutineDay,
    RoutineDayCreate,
    RoutinePlan,
    RoutinePlanCreate,
    RoutinePlanSend,
} from '../../../../shared/interfaces/routines.interface';
import { handleGraphqlError } from '../../../../shared/utils/handle-graphql-error';
import { map, Observable, tap } from 'rxjs';

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

    createPlan(planInput: RoutinePlanSend) {
        //aca debe llegar limpito
        return this.apollo
            .mutate<{ CreatePlan: RoutinePlan }>({
                mutation: gql`
                    mutation CreateRoutinePlan($input: CreateRoutinePlanInput!) {
                        createRoutinePlan(createRoutinePlanInput: $input) {
                            name
                            description
                            weekly_distribution
                            routineDays {
                                id
                            }
                            createdBy
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

    getRoutinePlanById(id: string): any {
        return this.apollo
            .query<{ routinePlan: RoutinePlanCreate | null }>({
                query: gql`
                    query GetRoutinePlan($id: String!) {
                        routinePlan(id: $id) {
                            id
                            name
                            description
                            weekly_distribution
                            routineDays {
                                id
                                title
                                type
                                exercises {
                                    id
                                    name
                                    category
                                }
                            }
                            createdBy
                        }
                    }
                `,
                variables: {
                    id: id,
                },
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                map((value) => value.data?.routinePlan),
            );
    }

    validateTitleUnique(title: string): Observable<boolean | undefined> {
        return this.apollo
            .query<{ validateTitleUnique: boolean }>({
                query: gql`
                    query ValidateTitleUnique($title: String!) {
                        validateTitleUnique(title: $title)
                    }
                `,
                variables: {
                    title: title,
                },
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                map((value) => value.data?.validateTitleUnique),
            );
    }
    createInputExercise(routineDay: RoutineDayCreate): string[] {
        if (routineDay.exercises === undefined) {
            return [''];
        }
        return routineDay.exercises.map((ex) => (ex.id ? ex.id : ''));
    }
}
