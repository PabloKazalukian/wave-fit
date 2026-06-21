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
    ProfileUser,
    Goal,
    HealthConstraint,
    Schedule,
    TrainingPreference,
    Resource,
    StrengthMetric,
    WeightLog,
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

    createUserProfile(input: UpdateProfileInput): Observable<ProfileUser | null> {
        return this.apollo
            .mutate<{ createUserProfile: ProfileUser }, { input: UpdateProfileInput }>({
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
    ): Observable<ProfileUser | null> {
        return this.apollo
            .mutate<
                { updateUserProfile: ProfileUser },
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

    upsertUserProfile(input: UpdateProfileInput): Observable<ProfileUser | null> {
        return this.apollo
            .mutate<{ upsertUserProfile: ProfileUser }, { input: UpdateProfileInput }>({
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

    removeUserProfile(id: string): Observable<ProfileUser | null> {
        return this.apollo
            .mutate<{ removeUserProfile: ProfileUser }, { id: string }>({
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

    updateUserGoals(input: UpdateGoalsInput): Observable<Goal | null> {
        return this.apollo
            .mutate<{ updateUserGoals: Goal }, { input: UpdateGoalsInput }>({
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
    ): Observable<HealthConstraint | null> {
        return this.apollo
            .mutate<
                { updateUserHealthConstraints: HealthConstraint },
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

    updateUserSchedule(input: UpdateScheduleInput): Observable<Schedule | null> {
        return this.apollo
            .mutate<{ updateUserSchedule: Schedule }, { input: UpdateScheduleInput }>({
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
    ): Observable<TrainingPreference | null> {
        return this.apollo
            .mutate<
                { updateUserTrainingPreference: TrainingPreference },
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

    updateUserResource(input: UpdateResourceInput): Observable<Resource | null> {
        return this.apollo
            .mutate<{ updateUserResource: Resource }, { input: UpdateResourceInput }>({
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
    ): Observable<StrengthMetric | null> {
        return this.apollo
            .mutate<
                { createUserStrengthMetric: StrengthMetric },
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

    removeUserStrengthMetric(id: string): Observable<StrengthMetric | null> {
        return this.apollo
            .mutate<{ removeUserStrengthMetric: StrengthMetric }, { id: string }>({
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

    createWeightLog(input: CreateWeightLogInput): Observable<WeightLog | null> {
        return this.apollo
            .mutate<{ createWeightLog: WeightLog }, { input: CreateWeightLogInput }>({
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
