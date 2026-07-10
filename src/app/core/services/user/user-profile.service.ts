import { DestroyRef, effect, inject, Injectable } from '@angular/core';
import { UserProfileDomainService } from './user-profile.domain';
import { UserProfileStateService } from './user-profile.state';
import { AuthService } from '../auth/auth.service';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Observable, tap } from 'rxjs';
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

@Injectable({
    providedIn: 'root',
})
export class UserProfileService {
    private destroyRef = inject(DestroyRef);
    private domain = inject(UserProfileDomainService);
    private state = inject(UserProfileStateService);
    private authService = inject(AuthService);

    user$ = toSignal(this.authService.user$);

    readonly userProfile = this.state.userProfile;
    readonly userProfile$ = this.state.userProfile$;
    readonly loading = this.state.loading;
    readonly error = this.state.error;

    constructor() {
        effect(() => {
            const user = this.user$();
            if (user) {
                console.log('UserProfileService detected user:', user);
                this.initUserProfile();
            } else {
                this.state.setUserProfile(null);
            }
        });
    }

    private initUserProfile() {
        if (this.state.getUserProfile()) {
            return;
        }

        this.state.setLoading(true);
        this.domain
            .initUserProfile()
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                tap({
                    next: (profileUser) => {
                        this.state.setUserProfile(profileUser);
                        this.state.setLoading(false);
                    },
                    error: (error) => {
                        console.error('Error fetching user profile context:', error);
                        this.state.setError(error.message || 'Error fetching profile');
                        this.state.setLoading(false);
                    },
                }),
            )
            .subscribe();
    }

    // For manual refreshing if needed
    fetchUserProfile(): Observable<ProfileUser | null> {
        this.state.setLoading(true);
        return this.domain.initUserProfile().pipe(
            tap({
                next: (profileUser) => {
                    console.log(profileUser);
                    this.state.setUserProfile(profileUser);
                    this.state.setLoading(false);
                },
                error: (error) => {
                    this.state.setError(error.message || 'Error fetching profile');
                    this.state.setLoading(false);
                },
            }),
        );
    }

    updateProfile(input: UpdateProfileInput): Observable<ProfileUser | null> {
        this.state.setLoading(true);
        const profile = this.state.getUserProfile();
        return this.domain.updateProfile(input, profile?.id || undefined).pipe(
            tap({
                next: (result) => {
                    if (result) {
                        const current = this.state.getUserProfile();
                        if (current) {
                            this.state.setUserProfile({ ...current, ...result });
                        } else {
                            this.state.setUserProfile(result);
                        }
                    }
                    this.state.setLoading(false);
                },
                error: (error) => {
                    this.state.setError(error.message || 'Error updating profile');
                    this.state.setLoading(false);
                },
            }),
        );
    }

    updateSchedule(input: UpdateScheduleInput): Observable<Schedule | null> {
        this.state.setLoading(true);
        return this.domain.updateSchedule(input).pipe(
            tap({
                next: (result) => {
                    if (result) {
                        const current = this.state.getUserProfile();
                        if (current) {
                            this.state.setUserProfile({ ...current, schedule: result });
                        }
                    }
                    this.state.setLoading(false);
                },
                error: (error) => {
                    this.state.setError(error.message || 'Error updating schedule');
                    this.state.setLoading(false);
                },
            }),
        );
    }

    updateTrainingPreference(
        input: UpdateTrainingPreferenceInput,
    ): Observable<TrainingPreference | null> {
        this.state.setLoading(true);
        return this.domain.updateTrainingPreference(input).pipe(
            tap({
                next: (result) => {
                    if (result) {
                        const current = this.state.getUserProfile();
                        if (current) {
                            this.state.setUserProfile({ ...current, trainingPreferences: result });
                        }
                    }
                    this.state.setLoading(false);
                },
                error: (error) => {
                    this.state.setError(error.message || 'Error updating training preference');
                    this.state.setLoading(false);
                },
            }),
        );
    }

    updateGoals(input: UpdateGoalsInput): Observable<Goal | null> {
        this.state.setLoading(true);
        return this.domain.updateGoals(input).pipe(
            tap({
                next: (result) => {
                    if (result) {
                        const current = this.state.getUserProfile();
                        if (current) {
                            this.state.setUserProfile({ ...current, goal: result });
                        }
                    }
                    this.state.setLoading(false);
                },
                error: (error) => {
                    this.state.setError(error.message || 'Error updating goals');
                    this.state.setLoading(false);
                },
            }),
        );
    }

    updateHealthConstraints(
        input: UpdateHealthConstraintsInput,
    ): Observable<HealthConstraint | null> {
        this.state.setLoading(true);
        return this.domain.updateHealthConstraints(input).pipe(
            tap({
                next: (result) => {
                    if (result) {
                        const current = this.state.getUserProfile();
                        if (current) {
                            this.state.setUserProfile({ ...current, healthConstraints: result });
                        }
                    }
                    this.state.setLoading(false);
                },
                error: (error) => {
                    this.state.setError(error.message || 'Error updating health constraints');
                    this.state.setLoading(false);
                },
            }),
        );
    }

    updateResource(input: UpdateResourceInput): Observable<Resource | null> {
        this.state.setLoading(true);
        return this.domain.updateResource(input).pipe(
            tap({
                next: (result) => {
                    if (result) {
                        const current = this.state.getUserProfile();
                        if (current) {
                            this.state.setUserProfile({ ...current, resources: result });
                        }
                    }
                    this.state.setLoading(false);
                },
                error: (error) => {
                    this.state.setError(error.message || 'Error updating resource');
                    this.state.setLoading(false);
                },
            }),
        );
    }

    createStrengthMetric(input: CreateStrengthMetricInput): Observable<StrengthMetric | null> {
        this.state.setLoading(true);
        return this.domain.createStrengthMetric(input).pipe(
            tap({
                next: (result) => {
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
                },
                error: (error) => {
                    this.state.setError(error.message || 'Error creating strength metric');
                    this.state.setLoading(false);
                },
            }),
        );
    }

    createWeightLog(input: CreateWeightLogInput): Observable<WeightLog | null> {
        this.state.setLoading(true);
        return this.domain.createWeightLog(input).pipe(
            tap({
                next: (result) => {
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
                },
                error: (error) => {
                    this.state.setError(error.message || 'Error creating weight log');
                    this.state.setLoading(false);
                },
            }),
        );
    }
}
