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
    ProfileUserAPI,
    GoalAPI,
    HealthConstraintAPI,
    ScheduleAPI,
    TrainingPreferenceAPI,
    ResourceAPI,
    StrengthMetricAPI,
    WeightLogAPI,
    UserProfileContextAPI,
} from '../../../../shared/utils/profile.types';

@Injectable({
    providedIn: 'root',
})
export class UserProfileApiGetService {
    private apollo = inject(Apollo);
    private authSvc = inject(AuthService);

    getUserProfileContext(): Observable<UserProfileContextAPI | null> {
        return this.apollo
            .query<{ userProfileContext: UserProfileContextAPI }>({
                query: gql`
                    ${USER_PROFILE_CONTEXT}
                `,
                fetchPolicy: 'no-cache',
                errorPolicy: 'all',
            })
            .pipe(
                map((res) => {
                    const ctx = res.data?.userProfileContext;
                    if (!ctx) return null;
                    // Si el profile existe pero no tiene id válido (ej: Mongoose lean() sin virtual),
                    // lo tratamos como null para no romper el mapeo.
                    const profile = ctx.profile?.id ? ctx.profile : null;
                    return { ...ctx, profile };
                }),
                handleGraphqlError(this.authSvc),
            );
    }

    getAllUserProfiles(): Observable<ProfileUserAPI[]> {
        return this.apollo
            .query<{ userProfiles: ProfileUserAPI[] }>({
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

    getUserProfile(id: string): Observable<ProfileUserAPI | null> {
        return this.apollo
            .query<{ userProfile: ProfileUserAPI }, { id: string }>({
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

    getMyProfile(): Observable<ProfileUserAPI | null> {
        return this.apollo
            .query<{ myProfile: ProfileUserAPI }>({
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

    getUserGoals(): Observable<GoalAPI | null> {
        return this.apollo
            .query<{ userGoals: GoalAPI }>({
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

    getUserHealthConstraints(): Observable<HealthConstraintAPI | null> {
        return this.apollo
            .query<{ userHealthConstraints: HealthConstraintAPI }>({
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

    getUserSchedule(): Observable<ScheduleAPI | null> {
        return this.apollo
            .query<{ userSchedule: ScheduleAPI }>({
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

    getUserTrainingPreference(): Observable<TrainingPreferenceAPI | null> {
        return this.apollo
            .query<{ userTrainingPreference: TrainingPreferenceAPI }>({
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

    getUserResource(): Observable<ResourceAPI | null> {
        return this.apollo
            .query<{ userResource: ResourceAPI }>({
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

    getUserStrengthMetrics(): Observable<StrengthMetricAPI[]> {
        return this.apollo
            .query<{ userStrengthMetrics: StrengthMetricAPI[] }>({
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

    getUserWeightLogs(): Observable<WeightLogAPI[]> {
        return this.apollo
            .query<{ userWeightLogs: WeightLogAPI[] }>({
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
