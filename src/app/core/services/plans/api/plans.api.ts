import { inject, Injectable } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { Apollo } from 'apollo-angular';
import {
    RoutineDayCreate,
    RoutinePlan,
    RoutinePlanSend,
    RoutinePlanVM,
} from '../../../../shared/interfaces/routines.interface';
import { handleGraphqlError } from '../../../../shared/utils/handle-graphql-error';
import { map, Observable, take } from 'rxjs';
import {
    CREATE_ROUTINE_PLAN,
    GET_PLANS,
    GET_ROUTINE_PLAN,
    IS_ROUTINE_TITLE_AVAILABLE,
} from '../../../apollo/plans.queries';
import {
    wrapperRoutineDayAPItoRoutineDayVM,
    wrapperRoutineDayToExerciseIds,
} from '../../../../shared/wrappers/routines.wrapper';
import { RoutinePlanAPI } from '../../../../shared/interfaces/api/routines-api.interface';

@Injectable({
    providedIn: 'root',
})
export class PlansApiService {
    private readonly apollo = inject(Apollo);
    private readonly authSvc = inject(AuthService);

    getPlans() {
        return this.apollo.query({
            query: GET_PLANS,
            fetchPolicy: 'no-cache',
        });
    }

    createPlan(planInput: RoutinePlanSend): Observable<RoutinePlan | null | undefined> {
        //aca debe llegar limpito
        return this.apollo
            .mutate<{ createRoutinePlan: RoutinePlan }>({
                mutation: CREATE_ROUTINE_PLAN,
                variables: { input: planInput },
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                map(({ data }) => data?.createRoutinePlan),
            );
    }

    getRoutinePlanById(id: string): Observable<RoutinePlanVM | undefined> {
        return this.apollo
            .query<{ routinePlan: RoutinePlanAPI | null }>({
                query: GET_ROUTINE_PLAN,
                variables: {
                    id: id,
                },
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                map((value) => value.data?.routinePlan),
                map((plan) => {
                    if (!plan || !plan.routineDays) return undefined;
                    return {
                        ...plan,
                        weekly_distribution: plan.weekly_distribution || '',
                        routineDays: wrapperRoutineDayAPItoRoutineDayVM(plan.routineDays),
                    };
                }),
            );
    }

    validateTitleUnique(title: string): Observable<boolean | undefined> {
        return this.apollo
            .query<{ isRoutineTitleAvailable: boolean }>({
                query: IS_ROUTINE_TITLE_AVAILABLE,
                variables: {
                    input: { title },
                },
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                take(1),
                map(({ data }) => {
                    return data?.isRoutineTitleAvailable;
                }),
            );
    }
    createInputExercise(routineDay: RoutineDayCreate): string[] {
        return wrapperRoutineDayToExerciseIds(routineDay);
    }
}
