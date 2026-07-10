import { inject, Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { map, Observable } from 'rxjs';

import {
    CREATE_USER_PROFILE,
    UPDATE_USER_PROFILE,
    UPSERT_USER_PROFILE,
    REMOVE_USER_PROFILE,
    UPDATE_USER_GOALS,
    UPDATE_USER_HEALTH_CONSTRAINTS,
    UPDATE_USER_SCHEDULE,
    UPDATE_USER_TRAINING_PREFERENCE,
    UPDATE_USER_RESOURCE,
    CREATE_USER_STRENGTH_METRIC,
    REMOVE_USER_STRENGTH_METRIC,
    CREATE_WEIGHT_LOG,
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
    UpdateProfileInput,
    UpdateGoalsInput,
    UpdateHealthConstraintsInput,
    UpdateScheduleInput,
    UpdateTrainingPreferenceInput,
    UpdateResourceInput,
    CreateStrengthMetricInput,
    CreateWeightLogInput,
} from '../../../../shared/utils/profile.types';

@Injectable({
    providedIn: 'root',
})
export class UserProfileApiSetService {
    private apollo = inject(Apollo);
    private authSvc = inject(AuthService);

    createUserProfile(input: UpdateProfileInput): Observable<ProfileUserAPI | null> {
        return this.apollo
            .mutate<{ createUserProfile: ProfileUserAPI }, { input: UpdateProfileInput }>({
                mutation: gql`
                    ${CREATE_USER_PROFILE}
                `,
                variables: { input },
            })
            .pipe(
                map((res) => res.data?.createUserProfile || null),
                handleGraphqlError(this.authSvc),
            );
    }

    updateUserProfile(
        input: UpdateProfileInput & { id: string },
    ): Observable<ProfileUserAPI | null> {
        return this.apollo
            .mutate<
                { updateUserProfile: ProfileUserAPI },
                { input: UpdateProfileInput & { id: string } }
            >({
                mutation: gql`
                    ${UPDATE_USER_PROFILE}
                `,
                variables: { input },
            })
            .pipe(
                map((res) => res.data?.updateUserProfile || null),
                handleGraphqlError(this.authSvc),
            );
    }

    upsertUserProfile(input: UpdateProfileInput): Observable<ProfileUserAPI | null> {
        return this.apollo
            .mutate<{ upsertUserProfile: ProfileUserAPI }, { input: UpdateProfileInput }>({
                mutation: gql`
                    ${UPSERT_USER_PROFILE}
                `,
                variables: { input },
            })
            .pipe(
                map((res) => res.data?.upsertUserProfile || null),
                handleGraphqlError(this.authSvc),
            );
    }

    removeUserProfile(id: string): Observable<ProfileUserAPI | null> {
        return this.apollo
            .mutate<{ removeUserProfile: ProfileUserAPI }, { id: string }>({
                mutation: gql`
                    ${REMOVE_USER_PROFILE}
                `,
                variables: { id },
            })
            .pipe(
                map((res) => res.data?.removeUserProfile || null),
                handleGraphqlError(this.authSvc),
            );
    }

    updateUserGoals(input: UpdateGoalsInput): Observable<GoalAPI | null> {
        return this.apollo
            .mutate<{ updateUserGoals: GoalAPI }, { input: UpdateGoalsInput }>({
                mutation: gql`
                    ${UPDATE_USER_GOALS}
                `,
                variables: { input },
            })
            .pipe(
                map((res) => res.data?.updateUserGoals || null),
                handleGraphqlError(this.authSvc),
            );
    }

    updateUserHealthConstraints(
        input: UpdateHealthConstraintsInput,
    ): Observable<HealthConstraintAPI | null> {
        return this.apollo
            .mutate<
                { updateUserHealthConstraints: HealthConstraintAPI },
                { input: UpdateHealthConstraintsInput }
            >({
                mutation: gql`
                    ${UPDATE_USER_HEALTH_CONSTRAINTS}
                `,
                variables: { input },
            })
            .pipe(
                map((res) => res.data?.updateUserHealthConstraints || null),
                handleGraphqlError(this.authSvc),
            );
    }

    updateUserSchedule(input: UpdateScheduleInput): Observable<ScheduleAPI | null> {
        return this.apollo
            .mutate<{ updateUserSchedule: ScheduleAPI }, { input: UpdateScheduleInput }>({
                mutation: gql`
                    ${UPDATE_USER_SCHEDULE}
                `,
                variables: { input },
            })
            .pipe(
                map((res) => res.data?.updateUserSchedule || null),
                handleGraphqlError(this.authSvc),
            );
    }

    updateUserTrainingPreference(
        input: UpdateTrainingPreferenceInput,
    ): Observable<TrainingPreferenceAPI | null> {
        return this.apollo
            .mutate<
                { updateUserTrainingPreference: TrainingPreferenceAPI },
                { input: UpdateTrainingPreferenceInput }
            >({
                mutation: gql`
                    ${UPDATE_USER_TRAINING_PREFERENCE}
                `,
                variables: { input },
            })
            .pipe(
                map((res) => res.data?.updateUserTrainingPreference || null),
                handleGraphqlError(this.authSvc),
            );
    }

    updateUserResource(input: UpdateResourceInput): Observable<ResourceAPI | null> {
        return this.apollo
            .mutate<{ updateUserResource: ResourceAPI }, { input: UpdateResourceInput }>({
                mutation: gql`
                    ${UPDATE_USER_RESOURCE}
                `,
                variables: { input },
            })
            .pipe(
                map((res) => res.data?.updateUserResource || null),
                handleGraphqlError(this.authSvc),
            );
    }

    createUserStrengthMetric(
        input: CreateStrengthMetricInput,
    ): Observable<StrengthMetricAPI | null> {
        return this.apollo
            .mutate<
                { createUserStrengthMetric: StrengthMetricAPI },
                { input: CreateStrengthMetricInput }
            >({
                mutation: gql`
                    ${CREATE_USER_STRENGTH_METRIC}
                `,
                variables: { input },
            })
            .pipe(
                map((res) => res.data?.createUserStrengthMetric || null),
                handleGraphqlError(this.authSvc),
            );
    }

    removeUserStrengthMetric(id: string): Observable<StrengthMetricAPI | null> {
        return this.apollo
            .mutate<{ removeUserStrengthMetric: StrengthMetricAPI }, { id: string }>({
                mutation: gql`
                    ${REMOVE_USER_STRENGTH_METRIC}
                `,
                variables: { id },
            })
            .pipe(
                map((res) => res.data?.removeUserStrengthMetric || null),
                handleGraphqlError(this.authSvc),
            );
    }

    createWeightLog(input: CreateWeightLogInput): Observable<WeightLogAPI | null> {
        return this.apollo
            .mutate<{ createWeightLog: WeightLogAPI }, { input: CreateWeightLogInput }>({
                mutation: gql`
                    ${CREATE_WEIGHT_LOG}
                `,
                variables: { input },
            })
            .pipe(
                map((res) => res.data?.createWeightLog || null),
                handleGraphqlError(this.authSvc),
            );
    }
}
