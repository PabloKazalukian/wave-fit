import { inject, Injectable } from '@angular/core';
import { UserProfileApiService } from './api/user-profile-api.service';
import { UserProfileStateService } from './user-profile.state';
import { AuthService } from '../auth/auth.service';
import { catchError, map, Observable, of, tap } from 'rxjs';
import {
    Goal,
    HealthConstraint,
    ProfileUser,
    Resource,
    Schedule,
    StrengthMetric,
    TrainingPreference,
    UpdateGoalsInput,
    UpdateHealthConstraintsInput,
    UpdateProfileInput,
    UpdateResourceInput,
    UpdateScheduleInput,
    UpdateTrainingPreferenceInput,
    WeightLog,
    CreateStrengthMetricInput,
    CreateWeightLogInput,
} from '../../../shared/utils/profile.types';
import { handleGraphqlError } from '../../../shared/utils/handle-graphql-error';

@Injectable({
    providedIn: 'root',
})
export class UserProfileDomainService {
    private api = inject(UserProfileApiService);
    private state = inject(UserProfileStateService);
    private authSvc = inject(AuthService);

    initUserProfile(): Observable<ProfileUser | null> {
        this.state.setLoading(true);
        return this.api.getUserProfileContext().pipe(
            handleGraphqlError(this.authSvc),
            map((res) => {
                console.log(res);
                const ctx = res;
                if (!ctx || !ctx) return null;

                const profileUser: ProfileUser = {
                    _id: ctx._id,
                    userId: ctx.userId,
                    gender: ctx.gender,
                    birthDate: ctx.birthDate,
                    heightCm: ctx.heightCm,
                    weightKg: ctx.weightKg,
                    bodyFatPct: ctx.bodyFatPct,
                    distributionDays: 'Week-log', // Default as backend doesn't seem to store it
                    unitsPreference: ctx.unitsPreference,
                    createdAt: ctx.createdAt,
                    updatedAt: ctx.updatedAt,
                    goal: ctx.goal,
                    healthConstraints: ctx.healthConstraints,
                    schedule: ctx.schedule,
                    trainingPreferences: ctx.trainingPreferences,
                    resources: ctx.resources,
                    strengthMetrics: ctx.strengthMetrics || [],
                    weightLogs: ctx.weightLogs || [],
                };

                console.log(profileUser);
                return profileUser;
            }),
            tap((profileUser) => {
                this.state.setUserProfile(profileUser);
                this.state.setLoading(false);
            }),
            catchError((error) => {
                console.error('Error fetching user profile context:', error);
                this.state.setError(error.message || 'Error fetching profile');
                this.state.setLoading(false);
                return of(null);
            }),
        );
    }

    updateProfile(input: UpdateProfileInput): Observable<ProfileUser | null> {
        this.state.setLoading(true);
        const profile = this.state.getUserProfile();
        const payload = { ...input, id: profile?._id || '' };
        return this.api.updateUserProfile(payload).pipe(
            handleGraphqlError(this.authSvc),
            tap((result) => {
                if (result) {
                    const current = this.state.getUserProfile();
                    if (current) {
                        this.state.setUserProfile({ ...current, ...result });
                    }
                }
                this.state.setLoading(false);
            }),
            catchError((error) => {
                this.state.setError(error.message || 'Error updating profile');
                this.state.setLoading(false);
                return of(null);
            }),
        );
    }

    updateSchedule(input: UpdateScheduleInput): Observable<Schedule | null> {
        this.state.setLoading(true);
        return this.api.updateUserSchedule(input).pipe(
            handleGraphqlError(this.authSvc),
            tap((result) => {
                if (result) {
                    const current = this.state.getUserProfile();
                    if (current) {
                        this.state.setUserProfile({ ...current, schedule: result });
                    }
                }
                this.state.setLoading(false);
            }),
            catchError((error) => {
                this.state.setError(error.message || 'Error updating schedule');
                this.state.setLoading(false);
                return of(null);
            }),
        );
    }

    updateTrainingPreference(
        input: UpdateTrainingPreferenceInput,
    ): Observable<TrainingPreference | null> {
        this.state.setLoading(true);
        return this.api.updateUserTrainingPreference(input).pipe(
            handleGraphqlError(this.authSvc),
            tap((result) => {
                if (result) {
                    const current = this.state.getUserProfile();
                    if (current) {
                        this.state.setUserProfile({ ...current, trainingPreferences: result });
                    }
                }
                this.state.setLoading(false);
            }),
            catchError((error) => {
                this.state.setError(error.message || 'Error updating training preference');
                this.state.setLoading(false);
                return of(null);
            }),
        );
    }

    updateGoals(input: UpdateGoalsInput): Observable<Goal | null> {
        this.state.setLoading(true);
        return this.api.updateUserGoals(input).pipe(
            handleGraphqlError(this.authSvc),
            tap((result) => {
                if (result) {
                    const current = this.state.getUserProfile();
                    if (current) {
                        this.state.setUserProfile({ ...current, goal: result });
                    }
                }
                this.state.setLoading(false);
            }),
            catchError((error) => {
                this.state.setError(error.message || 'Error updating goals');
                this.state.setLoading(false);
                return of(null);
            }),
        );
    }

    updateHealthConstraints(
        input: UpdateHealthConstraintsInput,
    ): Observable<HealthConstraint | null> {
        this.state.setLoading(true);
        return this.api.updateUserHealthConstraints(input).pipe(
            handleGraphqlError(this.authSvc),
            tap((result) => {
                if (result) {
                    const current = this.state.getUserProfile();
                    if (current) {
                        this.state.setUserProfile({ ...current, healthConstraints: result });
                    }
                }
                this.state.setLoading(false);
            }),
            catchError((error) => {
                this.state.setError(error.message || 'Error updating health constraints');
                this.state.setLoading(false);
                return of(null);
            }),
        );
    }

    updateResource(input: UpdateResourceInput): Observable<Resource | null> {
        this.state.setLoading(true);
        return this.api.updateUserResource(input).pipe(
            handleGraphqlError(this.authSvc),
            tap((result) => {
                if (result) {
                    const current = this.state.getUserProfile();
                    if (current) {
                        this.state.setUserProfile({ ...current, resources: result });
                    }
                }
                this.state.setLoading(false);
            }),
            catchError((error) => {
                this.state.setError(error.message || 'Error updating resource');
                this.state.setLoading(false);
                return of(null);
            }),
        );
    }

    createStrengthMetric(input: CreateStrengthMetricInput): Observable<StrengthMetric | null> {
        this.state.setLoading(true);
        return this.api.createUserStrengthMetric(input).pipe(
            handleGraphqlError(this.authSvc),
            tap((result) => {
                if (result) {
                    const current = this.state.getUserProfile();
                    if (current) {
                        this.state.setUserProfile({
                            ...current,
                            strengthMetrics: [...current.strengthMetrics, result],
                        });
                    }
                }
                this.state.setLoading(false);
            }),
            catchError((error) => {
                this.state.setError(error.message || 'Error creating strength metric');
                this.state.setLoading(false);
                return of(null);
            }),
        );
    }

    createWeightLog(input: CreateWeightLogInput): Observable<WeightLog | null> {
        this.state.setLoading(true);
        return this.api.createWeightLog(input).pipe(
            handleGraphqlError(this.authSvc),
            tap((result) => {
                if (result) {
                    const current = this.state.getUserProfile();
                    if (current) {
                        this.state.setUserProfile({
                            ...current,
                            weightLogs: [...current.weightLogs, result],
                        });
                    }
                }
                this.state.setLoading(false);
            }),
            catchError((error) => {
                this.state.setError(error.message || 'Error creating weight log');
                this.state.setLoading(false);
                return of(null);
            }),
        );
    }
}
