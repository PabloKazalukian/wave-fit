import { Injectable } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { Apollo, gql } from 'apollo-angular';
import {
    CreateRoutinePlanInput,
    RoutineDay,
    RoutinePlan,
    RoutinePlanCreate,
} from '../../../../shared/interfaces/routines.interface';
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
        console.log('plan inputt', planInput);
        console.log(this.createInputPlan(planInput));
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
                variables: { input: this.createInputPlan(planInput) },
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                tap((value) => console.log(value)),
            );
    }

    createInputPlan(plan: RoutinePlanCreate): CreateRoutinePlanInput | null {
        if (
            plan.weekly_distribution !== undefined &&
            plan.createdBy !== undefined &&
            plan.routineDays !== undefined
        ) {
            const input: CreateRoutinePlanInput = {
                name: plan.name,
                description: plan.description,
                weekly_distribution: plan.weekly_distribution,
                createdBy: plan.createdBy,
                routineDays: plan.routineDays
                    .filter((day) => day?.id) // 👈 evita {} vacíos
                    .map((day: RoutineDay) => ({
                        title: day.title,
                        type: day.type,
                        exercises: this.createInputExercise(day),
                    })),
            };

            const output: any = {
                name: plan.name,
                description: plan.description,
                weekly_distribution: plan.weekly_distribution,
                createdBy: plan.createdBy,
                routineDays: plan.routineDays.map((routine) => routine.id),
            };
            return output;
        }
        return null;
    }

    getRoutinePlanById(id: string): any {
        return this.apollo.query<{ routinePlan: RoutinePlanCreate | null }>({
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
        });
    }
    createInputExercise(routineDay: RoutineDay): string[] {
        if (routineDay.exercises === undefined) {
            return [''];
        }
        return routineDay.exercises.map((ex) => (ex.id ? ex.id : ''));
    }
}
