import { inject, Injectable } from '@angular/core';
import { UserProfileApiService } from './api/user-profile-api.service';
import { AuthService } from '../auth/auth.service';
import { map, Observable } from 'rxjs';
import {
    Goal,
    HealthConstraint,
    Schedule,
    TrainingPreference,
    Resource,
    StrengthMetric,
    WeightLog,
    ProfileUser,
    UpdateGoalsInput,
    UpdateHealthConstraintsInput,
    UpdateProfileInput,
    UpdateResourceInput,
    UpdateScheduleInput,
    UpdateTrainingPreferenceInput,
    CreateStrengthMetricInput,
    CreateWeightLogInput,
} from '../../../shared/utils/profile.types';
import { handleGraphqlError } from '../../../shared/utils/handle-graphql-error';
import { localDateToUtc } from '../../../shared/utils/date.utils';
import {
    wrapperGoalToDomain,
    wrapperHealthConstraintToDomain,
    wrapperScheduleToDomain,
    wrapperTrainingPreferenceToDomain,
    wrapperResourceToDomain,
    wrapperStrengthMetricToDomain,
    wrapperWeightLogToDomain,
    wrapperProfileUserToDomain,
    wrapperProfileContextToDomain,
} from '../../../shared/wrappers/profile.wrapper';

@Injectable({
    providedIn: 'root',
})
export class UserProfileDomainService {
    private api = inject(UserProfileApiService);
    private authSvc = inject(AuthService);

    initUserProfile(): Observable<ProfileUser | null> {
        return this.api.getUserProfileContext().pipe(
            handleGraphqlError(this.authSvc),
            map((res) => {
                // console.log('getUserProfileContext raw response:', res);
                const profileUser = wrapperProfileContextToDomain(res);
                // console.log('Sanitized domain profileUser:', profileUser);
                return profileUser;
            }),
        );
    }

    updateProfile(input: UpdateProfileInput, profileId?: string): Observable<ProfileUser | null> {
        const payload: any = { ...input };

        if (payload.heightCm !== undefined) payload.heightCm = Number(payload.heightCm);
        if (payload.weightKg !== undefined) payload.weightKg = Number(payload.weightKg);
        if (payload.bodyFatPct !== undefined) payload.bodyFatPct = Number(payload.bodyFatPct);
        if (payload.birthDate) payload.birthDate = localDateToUtc(payload.birthDate).toISOString();

        const request$ = profileId
            ? this.api.updateUserProfile({ ...payload, id: profileId })
            : this.api.upsertUserProfile(payload);

        return request$.pipe(
            handleGraphqlError(this.authSvc),
            map((res) => wrapperProfileUserToDomain(res)),
        );
    }

    updateSchedule(input: UpdateScheduleInput): Observable<Schedule | null> {
        const payload: any = { ...input };
        if (payload.daysPerWeek !== undefined) payload.daysPerWeek = Number(payload.daysPerWeek);
        if (payload.sessionDurationMin !== undefined)
            payload.sessionDurationMin = Number(payload.sessionDurationMin);

        return this.api.updateUserSchedule(payload).pipe(
            handleGraphqlError(this.authSvc),
            map((res) => wrapperScheduleToDomain(res)),
        );
    }

    updateTrainingPreference(
        input: UpdateTrainingPreferenceInput,
    ): Observable<TrainingPreference | null> {
        return this.api.updateUserTrainingPreference(input).pipe(
            handleGraphqlError(this.authSvc),
            map((res) => wrapperTrainingPreferenceToDomain(res)),
        );
    }

    updateGoals(input: UpdateGoalsInput): Observable<Goal | null> {
        const payload: any = { ...input };
        if (payload.targetWeightKg !== undefined)
            payload.targetWeightKg = Number(payload.targetWeightKg);
        if (payload.timelineWeeks !== undefined)
            payload.timelineWeeks = Number(payload.timelineWeeks);

        return this.api.updateUserGoals(payload).pipe(
            handleGraphqlError(this.authSvc),
            map((res) => wrapperGoalToDomain(res)),
        );
    }

    updateHealthConstraints(
        input: UpdateHealthConstraintsInput,
    ): Observable<HealthConstraint | null> {
        return this.api.updateUserHealthConstraints(input).pipe(
            handleGraphqlError(this.authSvc),
            map((res) => wrapperHealthConstraintToDomain(res)),
        );
    }

    updateResource(input: UpdateResourceInput): Observable<Resource | null> {
        const payload: any = { ...input };
        if (payload.dumbbellMaxKg !== undefined)
            payload.dumbbellMaxKg = Number(payload.dumbbellMaxKg);
        if (payload.gymDistanceKm !== undefined)
            payload.gymDistanceKm = Number(payload.gymDistanceKm);

        return this.api.updateUserResource(payload).pipe(
            handleGraphqlError(this.authSvc),
            map((res) => wrapperResourceToDomain(res)),
        );
    }

    createStrengthMetric(input: CreateStrengthMetricInput): Observable<StrengthMetric | null> {
        const payload: any = { ...input };
        if (payload.oneRmKg !== undefined) payload.oneRmKg = Number(payload.oneRmKg);
        if (payload.repsAtWeight) {
            payload.repsAtWeight = { ...payload.repsAtWeight };
            payload.repsAtWeight.weightKg = Number(payload.repsAtWeight.weightKg);
            payload.repsAtWeight.reps = Number(payload.repsAtWeight.reps);
        }
        if (payload.measuredAt)
            payload.measuredAt = localDateToUtc(payload.measuredAt).toISOString();

        return this.api.createUserStrengthMetric(payload).pipe(
            handleGraphqlError(this.authSvc),
            map((res) => (res ? wrapperStrengthMetricToDomain(res) : null)),
        );
    }

    createWeightLog(input: CreateWeightLogInput): Observable<WeightLog | null> {
        const payload: any = { ...input };
        if (payload.weightKg !== undefined) payload.weightKg = Number(payload.weightKg);
        if (payload.bodyFatPct !== undefined) payload.bodyFatPct = Number(payload.bodyFatPct);
        if (payload.loggedAt) payload.loggedAt = localDateToUtc(payload.loggedAt).toISOString();

        return this.api.createWeightLog(payload).pipe(
            handleGraphqlError(this.authSvc),
            map((res) => (res ? wrapperWeightLogToDomain(res) : null)),
        );
    }
}
