import { inject, Injectable } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { Apollo } from 'apollo-angular';
import {
    RoutineDayCreate,
    RoutinePlan,
    RoutinePlanCreate,
    RoutinePlanSend,
} from '../../../../shared/interfaces/routines.interface';
import { handleGraphqlError } from '../../../../shared/utils/handle-graphql-error';
import { map, Observable, tap } from 'rxjs';
import {
    CREATE_ROUTINE_PLAN,
    GET_PLANS,
    GET_ROUTINE_PLAN,
    IS_ROUTINE_TITLE_AVAILABLE,
} from '../../../apollo/plans.queries';

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
                tap((e) => {
                    console.log(e);
                }),
                map(({ data }) => data?.createRoutinePlan),
            );
    }

    getRoutinePlanById(id: string): Observable<RoutinePlanCreate | null | undefined> {
        return this.apollo
            .query<{ routinePlan: RoutinePlanCreate | null }>({
                query: GET_ROUTINE_PLAN,
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
            .query<{ isRoutineTitleAvailable: boolean }>({
                query: IS_ROUTINE_TITLE_AVAILABLE,
                variables: {
                    input: { title },
                },
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                map(({ data }) => {
                    console.log(data);
                    return data?.isRoutineTitleAvailable;
                }),
            );
    }
    createInputExercise(routineDay: RoutineDayCreate): string[] {
        if (routineDay.exercises === undefined) {
            return [''];
        }
        return routineDay.exercises.map((ex) => (ex.id ? ex.id : ''));
    }
}
