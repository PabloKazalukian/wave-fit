import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { UserProfileApiGetService } from './user-profile-api.get.service';
import { UserProfileApiSetService } from './user-profile-api.set.service';

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
export class UserProfileApiService {
    private get = inject(UserProfileApiGetService);
    private set = inject(UserProfileApiSetService);

    // ── Queries (delegadas a GetService) ──

    getUserProfileContext(): Observable<ProfileUser | null> {
        return this.get.getUserProfileContext();
    }

    getAllUserProfiles(): Observable<ProfileUser[]> {
        return this.get.getAllUserProfiles();
    }

    getUserProfile(id: string): Observable<ProfileUser | null> {
        return this.get.getUserProfile(id);
    }

    getMyProfile(): Observable<ProfileUser | null> {
        return this.get.getMyProfile();
    }

    getUserGoals(): Observable<Goal | null> {
        return this.get.getUserGoals();
    }

    getUserHealthConstraints(): Observable<HealthConstraint | null> {
        return this.get.getUserHealthConstraints();
    }

    getUserSchedule(): Observable<Schedule | null> {
        return this.get.getUserSchedule();
    }

    getUserTrainingPreference(): Observable<TrainingPreference | null> {
        return this.get.getUserTrainingPreference();
    }

    getUserResource(): Observable<Resource | null> {
        return this.get.getUserResource();
    }

    getUserStrengthMetrics(): Observable<StrengthMetric[]> {
        return this.get.getUserStrengthMetrics();
    }

    getUserWeightLogs(): Observable<WeightLog[]> {
        return this.get.getUserWeightLogs();
    }

    // ── Mutations (delegadas a SetService) ──

    createUserProfile(input: UpdateProfileInput): Observable<ProfileUser | null> {
        return this.set.createUserProfile(input);
    }

    updateUserProfile(
        input: UpdateProfileInput & { id: string },
    ): Observable<ProfileUser | null> {
        return this.set.updateUserProfile(input);
    }

    upsertUserProfile(input: UpdateProfileInput): Observable<ProfileUser | null> {
        return this.set.upsertUserProfile(input);
    }

    removeUserProfile(id: string): Observable<ProfileUser | null> {
        return this.set.removeUserProfile(id);
    }

    updateUserGoals(input: UpdateGoalsInput): Observable<Goal | null> {
        return this.set.updateUserGoals(input);
    }

    updateUserHealthConstraints(
        input: UpdateHealthConstraintsInput,
    ): Observable<HealthConstraint | null> {
        return this.set.updateUserHealthConstraints(input);
    }

    updateUserSchedule(input: UpdateScheduleInput): Observable<Schedule | null> {
        return this.set.updateUserSchedule(input);
    }

    updateUserTrainingPreference(
        input: UpdateTrainingPreferenceInput,
    ): Observable<TrainingPreference | null> {
        return this.set.updateUserTrainingPreference(input);
    }

    updateUserResource(input: UpdateResourceInput): Observable<Resource | null> {
        return this.set.updateUserResource(input);
    }

    createUserStrengthMetric(
        input: CreateStrengthMetricInput,
    ): Observable<StrengthMetric | null> {
        return this.set.createUserStrengthMetric(input);
    }

    removeUserStrengthMetric(id: string): Observable<StrengthMetric | null> {
        return this.set.removeUserStrengthMetric(id);
    }

    createWeightLog(input: CreateWeightLogInput): Observable<WeightLog | null> {
        return this.set.createWeightLog(input);
    }
}
