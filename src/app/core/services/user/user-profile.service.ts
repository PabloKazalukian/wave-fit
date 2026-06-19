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
                console.log(user);

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

        this.domain
            .initUserProfile()
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                tap((e) => console.log(e)),
            )
            .subscribe();
    }

    // For manual refreshing if needed
    fetchUserProfile(): Observable<ProfileUser | null> {
        return this.domain.initUserProfile();
    }

    updateProfile(input: UpdateProfileInput): Observable<ProfileUser | null> {
        return this.domain.updateProfile(input);
    }

    updateSchedule(input: UpdateScheduleInput): Observable<Schedule | null> {
        return this.domain.updateSchedule(input);
    }

    updateTrainingPreference(
        input: UpdateTrainingPreferenceInput,
    ): Observable<TrainingPreference | null> {
        return this.domain.updateTrainingPreference(input);
    }

    updateGoals(input: UpdateGoalsInput): Observable<Goal | null> {
        return this.domain.updateGoals(input);
    }

    updateHealthConstraints(
        input: UpdateHealthConstraintsInput,
    ): Observable<HealthConstraint | null> {
        return this.domain.updateHealthConstraints(input);
    }

    updateResource(input: UpdateResourceInput): Observable<Resource | null> {
        return this.domain.updateResource(input);
    }

    createStrengthMetric(input: CreateStrengthMetricInput): Observable<StrengthMetric | null> {
        return this.domain.createStrengthMetric(input);
    }

    createWeightLog(input: CreateWeightLogInput): Observable<WeightLog | null> {
        return this.domain.createWeightLog(input);
    }
}
