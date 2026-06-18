import { inject, Injectable } from '@angular/core';
import { UserProfileApiService } from './api/user-profile-api.service';
import { UserProfileStateService } from './user-profile.state';
import { AuthService } from '../auth/auth.service';
import { catchError, map, Observable, of, tap } from 'rxjs';
import {
    ProfileUser,
    Schedule,
    TrainingPreference,
    UpdateProfileInput,
    UpdateScheduleInput,
    UpdateTrainingPreferenceInput,
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
                    trainingPreference: ctx.trainingPreference,
                    resource: ctx.resource,
                    strengthMetrics: ctx.strengthMetrics || [],
                    weightLogs: ctx.weightLogs || [],
                };

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

    updateTrainingPreference(input: UpdateTrainingPreferenceInput): Observable<TrainingPreference | null> {
        this.state.setLoading(true);
        return this.api.updateUserTrainingPreference(input).pipe(
            handleGraphqlError(this.authSvc),
            tap((result) => {
                if (result) {
                    const current = this.state.getUserProfile();
                    if (current) {
                        this.state.setUserProfile({ ...current, trainingPreference: result });
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
}
