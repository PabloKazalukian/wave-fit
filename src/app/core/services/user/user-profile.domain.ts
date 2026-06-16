import { inject, Injectable } from '@angular/core';
import { UserProfileApiService } from './api/user-profile-api.service';
import { UserProfileStateService } from './user-profile.state';
import { AuthService } from '../auth/auth.service';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { ProfileUser } from '../../../shared/utils/profile.types';
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
}
