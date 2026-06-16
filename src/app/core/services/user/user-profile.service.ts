import { inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { Apollo, gql } from 'apollo-angular';
import { TokenStorage } from '../../auth/token.storage';
import { ProfileUser } from '../../../shared/utils/profile.types';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { handleGraphqlError } from '../../../shared/utils/handle-graphql-error';
import { AuthService } from '../auth/auth.service';

@Injectable({
    providedIn: 'root',
})
export class UserProfileService {
    private apollo = inject(Apollo);
    private tokenStorage = inject(TokenStorage);
    private readonly router = inject(Router);
    private authSvc = inject(AuthService);

    userProfile$ = toSignal<ProfileUser | null>(this.userProfileContext());

    userProfile() {
        return this.userProfileContext();
    }

    userProfileContext(): Observable<ProfileUser | null> {
        const query = gql`
            query UserProfileContext {
                userProfileContext {
                    profile {
                        id
                        userId
                        sex
                        birthDate
                        heightCm
                        weightKg
                        bodyFatPct
                        unitsPreference
                        createdAt
                        updatedAt
                    }
                    goal {
                        _id
                        userId
                        primaryGoal
                        secondaryGoals
                        targetWeightKg
                        timelineWeeks
                        trainingExperience
                        sportSpecificity
                        isActive
                        createdAt
                        updatedAt
                    }
                    healthConstraints {
                        _id
                        userId
                        injuries {
                            bodyPart
                            severity
                            isActive
                            description
                        }
                        movementRestrictions
                        conditions
                        mobilityLevel
                        hasHealthcareSupervision
                        createdAt
                        updatedAt
                    }
                    schedule {
                        _id
                        userId
                        daysPerWeek
                        preferredDays
                        sessionDurationMin
                        preferredTime
                        restDayActivity
                        createdAt
                        updatedAt
                    }
                    trainingPreferences {
                        _id
                        userId
                        preferredStyles
                        dislikedExercises
                        favoriteExercises
                        cardioPreference
                        intensityPreference
                        workoutVibe
                        createdAt
                        updatedAt
                    }
                    resources {
                        _id
                        userId
                        trainingEnvironments
                        equipment {
                            barbell
                            squat_rack
                            power_rack
                            cables
                            smith_machine
                            leg_press
                            dumbbells
                            kettlebells
                            resistance_bands
                            pullup_bar
                            dip_bars
                            trx
                            treadmill
                            stationary_bike
                            rowing_machine
                            elliptical
                            jump_rope
                            ab_wheel
                            foam_roller
                        }
                        dumbbellMaxKg
                        gymDistanceKm
                        createdAt
                        updatedAt
                    }
                    strengthMetrics {
                        _id
                        userId
                        exerciseKey
                        oneRmKg
                        repsAtWeight {
                            weightKg
                            reps
                        }
                        confidenceLevel
                        measuredAt
                        notes
                        createdAt
                        updatedAt
                    }
                    weightLogs {
                        _id
                        userId
                        weightKg
                        bodyFatPct
                        loggedAt
                        notes
                        createdAt
                        updatedAt
                    }
                }
            }
        `;

        return this.apollo
            .query<any>({
                query,
                fetchPolicy: 'no-cache',
            })
            .pipe(
                handleGraphqlError(this.authSvc),
                tap((res) => console.log('UserProfileContext Response:', res)),
                map((res) => {
                    const ctx = res.data?.userProfileContext;
                    if (!ctx || !ctx.profile) return null;
                    
                    const profileUser: ProfileUser = {
                        _id: ctx.profile.id,
                        userId: ctx.profile.userId,
                        gender: ctx.profile.sex,
                        birthDate: ctx.profile.birthDate,
                        heightCm: ctx.profile.heightCm,
                        weightKg: ctx.profile.weightKg,
                        bodyFatPct: ctx.profile.bodyFatPct,
                        distributionDays: 'Week-log', // Default as backend doesn't seem to store it
                        unitsPreference: ctx.profile.unitsPreference,
                        createdAt: ctx.profile.createdAt,
                        updatedAt: ctx.profile.updatedAt,
                        goal: ctx.goal,
                        healthConstraints: ctx.healthConstraints,
                        schedule: ctx.schedule,
                        trainingPreference: ctx.trainingPreferences,
                        resource: ctx.resources,
                        strengthMetrics: ctx.strengthMetrics || [],
                        weightLogs: ctx.weightLogs || [],
                    };
                    
                    return profileUser;
                }),
                catchError((error) => {
                    console.error('Error fetching user profile context:', error);
                    return of(null);
                }),
            );
    }
}
