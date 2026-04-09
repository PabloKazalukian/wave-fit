import { inject, Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import {
    GET_EXTRA_SESSION_CATALOG,
    UPDATE_EXTRA_SESSION,
    REMOVE_EXTRA_SESSION,
    GET_EXTRA_SESSIONS_BY_WORKOUT,
} from '../../../apollo/extra-session.queries';
import {
    CreateExtraSessionForm,
    ExtraSession,
    ExtraSessionDisciplineConfig,
    UpdateExtraSessionInput,
} from '../../../../shared/interfaces/extra-session.interface';
import { handleGraphqlError } from '../../../../shared/utils/handle-graphql-error';
import { AuthService } from '../../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class ExtraSessionApi {
    private apollo = inject(Apollo);
    private authSvc = inject(AuthService);

    getCatalog(): Observable<ExtraSessionDisciplineConfig[]> {
        return this.apollo
            .query<{ extraSessionCatalog: ExtraSessionDisciplineConfig[] }>({
                query: GET_EXTRA_SESSION_CATALOG,
                fetchPolicy: 'cache-first',
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                map((res) => res.data?.extraSessionCatalog || []),
            );
    }

    getByWorkoutSession(workoutSessionId: string): Observable<ExtraSession[]> {
        return this.apollo
            .query<{ extraSessionsByWorkoutSession: ExtraSession[] }>({
                query: GET_EXTRA_SESSIONS_BY_WORKOUT,
                variables: { workoutSessionId },
                fetchPolicy: 'network-only',
            })
            .pipe(
                tap((res) => console.log(workoutSessionId, res)),
                handleGraphqlError(this.authSvc),
                map((res) => res.data?.extraSessionsByWorkoutSession || []),
            );
    }

    // create(createExtraSessionInput: CreateExtraSessionForm): Observable<ExtraSession> {
    //     return this.apollo
    //         .mutate<{ createExtraSession: ExtraSession }>({
    //             mutation: CREATE_EXTRA_SESSION,
    //             variables: { createExtraSessionInput },
    //         })
    //         .pipe(
    //             handleGraphqlError(this.authSvc),
    //             map((res) => res.data!.createExtraSession),
    //         );
    // }

    update(updateExtraSessionInput: UpdateExtraSessionInput): Observable<ExtraSession> {
        return this.apollo
            .mutate<{ updateExtraSession: ExtraSession }>({
                mutation: UPDATE_EXTRA_SESSION,
                variables: { updateExtraSessionInput },
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                map((res) => res.data!.updateExtraSession),
            );
    }

    remove(id: string): Observable<boolean> {
        return this.apollo
            .mutate<{ removeExtraSession: boolean }>({
                mutation: REMOVE_EXTRA_SESSION,
                variables: { id },
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                map((res) => res.data!.removeExtraSession),
            );
    }
}
