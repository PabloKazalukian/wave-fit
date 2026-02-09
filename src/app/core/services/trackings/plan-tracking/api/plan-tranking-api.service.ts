import { inject, Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { handleGraphqlError } from '../../../../../shared/utils/handle-graphql-error';
import { AuthService } from '../../../auth/auth.service';
import { map, Observable, tap } from 'rxjs';
import { Tracking, TrackingCreate } from '../../../../../shared/interfaces/tracking.interface';

@Injectable({
    providedIn: 'root',
})
export class PlanTrankingApi {
    private readonly apollo = inject(Apollo);

    authSvc = inject(AuthService);

    getTrackingByUser() {
        return this.apollo
            .query<{ activeWeekLog: Tracking }>({
                query: gql`
                    query findActiveWeekLog {
                        activeWeekLog {
                            id
                            startDate
                            endDate
                            userId
                            workouts {
                                id
                            }
                            extras {
                                id
                            }
                            planId
                            notes
                        }
                    }
                `,
                fetchPolicy: 'no-cache',
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                tap((e) => {
                    console.log(e);
                }),
                map(({ data }) => data?.activeWeekLog),
            );
    }

    createTracking(payload: TrackingCreate): Observable<Tracking | undefined | null> {
        return this.apollo
            .mutate<{ createTracking: Tracking }>({
                mutation: gql`
                    mutation CreateWeekLog($input: CreateWeekLogInput!) {
                        createWeekLog(createWeekLogInput: $input) {
                            id
                            startDate
                            endDate
                        }
                    }
                `,
                variables: { input: payload },
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                tap((e) => {
                    console.log(e);
                }),
                map(({ data }) => data?.createTracking),
            );
    }
}
