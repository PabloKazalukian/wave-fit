import { DestroyRef, effect, inject, Injectable } from '@angular/core';
import { UserProfileDomainService } from './user-profile.domain';
import { UserProfileStateService } from './user-profile.state';
import { AuthService } from '../auth/auth.service';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { catchError, concat, concatMap, finalize, map, Observable, of, tap, toArray } from 'rxjs';
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
    ToggleFavoriteExerciseAPI,
    ToggleFavoriteRoutineAPI,
    ToggleFavoriteRoutineDayAPI,
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
    readonly savingSetup = this.state.savingSetup;
    readonly error = this.state.error;

    constructor() {
        effect(() => {
            const user = this.user$();
            if (user) {
                // console.log('UserProfileService detected user:', user);
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
                    },
                    error: (error) => {
                        console.error('Error fetching user profile context:', error);
                        this.state.setError(error.message || 'Error fetching profile');
                    },
                }),
                finalize(() => this.state.setLoading(false)),
            )
            .subscribe();
    }

    // For manual refreshing if needed
    fetchUserProfile(): Observable<ProfileUser | null> {
        this.state.setLoading(true);
        return this.domain.initUserProfile().pipe(
            tap({
                next: (profileUser) => {
                    this.state.setUserProfile(profileUser);
                },
                error: (error) => {
                    this.state.setError(error.message || 'Error fetching profile');
                },
            }),
            finalize(() => this.state.setLoading(false)),
        );
    }

    /**
     * Guardado secuencial del setup básico (perfil → objetivos → horario) y
     * refetch del contexto completo como fuente de verdad final.
     * Si un paso falla, se registra y continúa con los restantes.
     */
    completeBasicSetup(input: {
        profile: UpdateProfileInput;
        goals: UpdateGoalsInput;
        schedule: UpdateScheduleInput;
    }): Observable<{ profile: ProfileUser | null; failedSteps: string[] }> {
        const failedSteps: string[] = [];

        const step = <T>(name: string, source$: Observable<T>): Observable<T | null> =>
            source$.pipe(
                catchError(() => {
                    failedSteps.push(name);
                    return of(null);
                }),
            );

        this.state.setSaving(true);
        return concat(
            step('perfil', this.updateProfile(input.profile)),
            step('objetivos', this.updateGoals(input.goals)),
            step('horario', this.updateSchedule(input.schedule)),
        ).pipe(
            toArray(),
            concatMap(() => this.fetchUserProfile()),
            map((profile) => ({ profile, failedSteps })),
            finalize(() => this.state.setSaving(false)),
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
                },
                error: (error) => {
                    this.state.setError(error.message || 'Error updating profile');
                },
            }),
            finalize(() => this.state.setLoading(false)),
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
                },
                error: (error) => {
                    this.state.setError(error.message || 'Error updating schedule');
                },
            }),
            finalize(() => this.state.setLoading(false)),
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
                },
                error: (error) => {
                    this.state.setError(error.message || 'Error updating training preference');
                },
            }),
            finalize(() => this.state.setLoading(false)),
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
                },
                error: (error) => {
                    this.state.setError(error.message || 'Error updating goals');
                },
            }),
            finalize(() => this.state.setLoading(false)),
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
                },
                error: (error) => {
                    this.state.setError(error.message || 'Error updating health constraints');
                },
            }),
            finalize(() => this.state.setLoading(false)),
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
                },
                error: (error) => {
                    this.state.setError(error.message || 'Error updating resource');
                },
            }),
            finalize(() => this.state.setLoading(false)),
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
                },
                error: (error) => {
                    this.state.setError(error.message || 'Error creating strength metric');
                },
            }),
            finalize(() => this.state.setLoading(false)),
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
                },
                error: (error) => {
                    this.state.setError(error.message || 'Error creating weight log');
                },
            }),
            finalize(() => this.state.setLoading(false)),
        );
    }

    toggleFavoriteExercise(exerciseId: string): Observable<ToggleFavoriteExerciseAPI | null> {
        return this.domain.toggleFavoriteExercise(exerciseId);
    }

    toggleFavoriteRoutine(routineId: string): Observable<ToggleFavoriteRoutineAPI | null> {
        return this.domain.toggleFavoriteRoutine(routineId);
    }

    toggleFavoriteRoutineDay(routineDayId: string): Observable<ToggleFavoriteRoutineDayAPI | null> {
        return this.domain.toggleFavoriteRoutineDay(routineDayId);
    }

    resetMyProfile(): Observable<boolean | null> {
        this.state.setLoading(true);
        return this.domain.resetMyProfile().pipe(
            tap({
                next: (result) => {
                    if (result) {
                        // El backend borra TODO el user-profile: limpiar el estado local
                        this.state.setUserProfile(null);
                    }
                },
                error: (error) => {
                    this.state.setError(error.message || 'Error resetting profile');
                },
            }),
            // Tras borrar, recargar el perfil desde el backend para repoblar el
            // estado con el contexto vacío y que todas las vistas (coach, form,
            // perfil) reaccionen sin depender de caché colgada.
            concatMap((result) =>
                result
                    ? this.fetchUserProfile().pipe(
                          catchError(() => of(null)),
                          map(() => result),
                      )
                    : of(result),
            ),
            finalize(() => this.state.setLoading(false)),
        );
    }
}
