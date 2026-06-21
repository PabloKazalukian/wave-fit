import { inject, Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { map, Observable } from 'rxjs';

import {
    USER_PROFILE_CONTEXT,
    FIND_ALL_USER_PROFILES,
    FIND_USER_PROFILE,
    MY_PROFILE,
    USER_GOALS,
    USER_HEALTH_CONSTRAINTS,
    USER_SCHEDULE,
    USER_TRAINING_PREFERENCE,
    USER_RESOURCE,
    USER_STRENGTH_METRICS,
    USER_WEIGHT_LOGS,
} from '../../../apollo/user-profile.queries';
import { handleGraphqlError } from '../../../../shared/utils/handle-graphql-error';
import { AuthService } from '../../auth/auth.service';
import {
    ProfileUser,
    Goal,
    HealthConstraint,
    Schedule,
    TrainingPreference,
    Resource,
    StrengthMetric,
    WeightLog,
} from '../../../../shared/utils/profile.types';

@Injectable({
    providedIn: 'root',
})
export class UserProfileApiGetService {
    private apollo = inject(Apollo);
    private authSvc = inject(AuthService);

    getUserProfileContext(): Observable<ProfileUser | null> {
        return this.apollo
            .query<{ userProfileContext: ProfileUser }>({
                query: gql`
                    ${USER_PROFILE_CONTEXT}
                `,
                fetchPolicy: 'no-cache',
            })
            .pipe(
                map((res) => res.data?.userProfileContext || null),
                handleGraphqlError(this.authSvc),
            );
    }

    getAllUserProfiles(): Observable<ProfileUser[]> {
        return this.apollo
            .query<{ userProfiles: ProfileUser[] }>({
                query: gql`
                    ${FIND_ALL_USER_PROFILES}
                `,
                fetchPolicy: 'no-cache',
            })
            .pipe(
                map((res) => res.data?.userProfiles || []),
                handleGraphqlError(this.authSvc),
            );
    }

    getUserProfile(id: string): Observable<ProfileUser | null> {
        return this.apollo
            .query<{ userProfile: ProfileUser }, { id: string }>({
                query: gql`
                    ${FIND_USER_PROFILE}
                `,
                variables: { id },
                fetchPolicy: 'no-cache',
            })
            .pipe(
                map((res) => res.data?.userProfile || null),
                handleGraphqlError(this.authSvc),
            );
    }

    getMyProfile(): Observable<ProfileUser | null> {
        return this.apollo
            .query<{ myProfile: ProfileUser }>({
                query: gql`
                    ${MY_PROFILE}
                `,
                fetchPolicy: 'no-cache',
            })
            .pipe(
                map((res) => res.data?.myProfile || null),
                handleGraphqlError(this.authSvc),
            );
    }

    getUserGoals(): Observable<Goal | null> {
        return this.apollo
            .query<{ userGoals: Goal }>({
                query: gql`
                    ${USER_GOALS}
                `,
                fetchPolicy: 'no-cache',
            })
            .pipe(
                map((res) => res.data?.userGoals || null),
                handleGraphqlError(this.authSvc),
            );
    }

    getUserHealthConstraints(): Observable<HealthConstraint | null> {
        return this.apollo
            .query<{ userHealthConstraints: HealthConstraint }>({
                query: gql`
                    ${USER_HEALTH_CONSTRAINTS}
                `,
                fetchPolicy: 'no-cache',
            })
            .pipe(
                map((res) => res.data?.userHealthConstraints || null),
                handleGraphqlError(this.authSvc),
            );
    }

    getUserSchedule(): Observable<Schedule | null> {
        return this.apollo
            .query<{ userSchedule: Schedule }>({
                query: gql`
                    ${USER_SCHEDULE}
                `,
                fetchPolicy: 'no-cache',
            })
            .pipe(
                map((res) => res.data?.userSchedule || null),
                handleGraphqlError(this.authSvc),
            );
    }

    getUserTrainingPreference(): Observable<TrainingPreference | null> {
        return this.apollo
            .query<{ userTrainingPreference: TrainingPreference }>({
                query: gql`
                    ${USER_TRAINING_PREFERENCE}
                `,
                fetchPolicy: 'no-cache',
            })
            .pipe(
                map((res) => res.data?.userTrainingPreference || null),
                handleGraphqlError(this.authSvc),
            );
    }

    getUserResource(): Observable<Resource | null> {
        return this.apollo
            .query<{ userResource: Resource }>({
                query: gql`
                    ${USER_RESOURCE}
                `,
                fetchPolicy: 'no-cache',
            })
            .pipe(
                map((res) => res.data?.userResource || null),
                handleGraphqlError(this.authSvc),
            );
    }

    getUserStrengthMetrics(): Observable<StrengthMetric[]> {
        return this.apollo
            .query<{ userStrengthMetrics: StrengthMetric[] }>({
                query: gql`
                    ${USER_STRENGTH_METRICS}
                `,
                fetchPolicy: 'no-cache',
            })
            .pipe(
                map((res) => res.data?.userStrengthMetrics || []),
                handleGraphqlError(this.authSvc),
            );
    }

    getUserWeightLogs(): Observable<WeightLog[]> {
        return this.apollo
            .query<{ userWeightLogs: WeightLog[] }>({
                query: gql`
                    ${USER_WEIGHT_LOGS}
                `,
                fetchPolicy: 'no-cache',
            })
            .pipe(
                map((res) => res.data?.userWeightLogs || []),
                handleGraphqlError(this.authSvc),
            );
    }
}
