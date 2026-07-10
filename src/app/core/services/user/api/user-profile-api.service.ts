import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { UserProfileApiGetService } from './user-profile-api.get.service';
import { UserProfileApiSetService } from './user-profile-api.set.service';

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

    getUserProfileContext(): Observable<UserProfileContextAPI | null> {
        return this.get.getUserProfileContext();
    }

    getAllUserProfiles(): Observable<ProfileUserAPI[]> {
        return this.get.getAllUserProfiles();
    }

    getUserProfile(id: string): Observable<ProfileUserAPI | null> {
        return this.get.getUserProfile(id);
    }

    getMyProfile(): Observable<ProfileUserAPI | null> {
        return this.get.getMyProfile();
    }

    getUserGoals(): Observable<GoalAPI | null> {
        return this.get.getUserGoals();
    }

    getUserHealthConstraints(): Observable<HealthConstraintAPI | null> {
        return this.get.getUserHealthConstraints();
    }

    getUserSchedule(): Observable<ScheduleAPI | null> {
        return this.get.getUserSchedule();
    }

    getUserTrainingPreference(): Observable<TrainingPreferenceAPI | null> {
        return this.get.getUserTrainingPreference();
    }

    getUserResource(): Observable<ResourceAPI | null> {
        return this.get.getUserResource();
    }

    getUserStrengthMetrics(): Observable<StrengthMetricAPI[]> {
        return this.get.getUserStrengthMetrics();
    }

    getUserWeightLogs(): Observable<WeightLogAPI[]> {
        return this.get.getUserWeightLogs();
    }

    // ── Mutations (delegadas a SetService) ──

    createUserProfile(input: UpdateProfileInput): Observable<ProfileUserAPI | null> {
        return this.set.createUserProfile(input);
    }

    updateUserProfile(
        input: UpdateProfileInput & { id: string },
    ): Observable<ProfileUserAPI | null> {
        return this.set.updateUserProfile(input);
    }

    upsertUserProfile(input: UpdateProfileInput): Observable<ProfileUserAPI | null> {
        return this.set.upsertUserProfile(input);
    }

    removeUserProfile(id: string): Observable<ProfileUserAPI | null> {
        return this.set.removeUserProfile(id);
    }

    updateUserGoals(input: UpdateGoalsInput): Observable<GoalAPI | null> {
        return this.set.updateUserGoals(input);
    }

    updateUserHealthConstraints(
        input: UpdateHealthConstraintsInput,
    ): Observable<HealthConstraintAPI | null> {
        return this.set.updateUserHealthConstraints(input);
    }

    updateUserSchedule(input: UpdateScheduleInput): Observable<ScheduleAPI | null> {
        return this.set.updateUserSchedule(input);
    }

    updateUserTrainingPreference(
        input: UpdateTrainingPreferenceInput,
    ): Observable<TrainingPreferenceAPI | null> {
        return this.set.updateUserTrainingPreference(input);
    }

    updateUserResource(input: UpdateResourceInput): Observable<ResourceAPI | null> {
        return this.set.updateUserResource(input);
    }

    createUserStrengthMetric(
        input: CreateStrengthMetricInput,
    ): Observable<StrengthMetricAPI | null> {
        return this.set.createUserStrengthMetric(input);
    }

    removeUserStrengthMetric(id: string): Observable<StrengthMetricAPI | null> {
        return this.set.removeUserStrengthMetric(id);
    }

    createWeightLog(input: CreateWeightLogInput): Observable<WeightLogAPI | null> {
        return this.set.createWeightLog(input);
    }
}
