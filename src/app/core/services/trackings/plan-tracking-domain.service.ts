import { DestroyRef, effect, inject, Injectable } from '@angular/core';
import { PlanTrackingApi } from './plan-tracking/api/plan-tranking-api.service';
import { PlanTrackingStorage } from './plan-tracking/storage/plan-tracking-storage.service';
import { PlanTrackingStateService } from './plan-tracking-state.service';
import { filter, finalize, map, Observable, of, switchMap, tap } from 'rxjs';
import {
    ExercisePerformanceVM,
    StatusWorkoutSessionEnum,
    TrackingVM,
    TrackingVMS,
    WorkoutSessionVM,
} from '../../../shared/interfaces/tracking.interface';
import { DateService } from '../date.service';
import { AuthService } from '../auth/auth.service';
import {
    TrackingCreate,
    UpdateWeekLogDayInput,
    UpdateWeekLogInput,
} from '../../../shared/interfaces/api/tracking-api.interface';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';

@Injectable({
    providedIn: 'root',
})
export class PlanTrackingDomainService {
    destroyRef = inject(DestroyRef);

    private api = inject(PlanTrackingApi);
    private state = inject(PlanTrackingStateService);
    private storage = inject(PlanTrackingStorage);
    private dateService = inject(DateService);
    private authService = inject(AuthService);

    user$ = toSignal(this.authService.user$);

    constructor() {
        effect(() => {
            const user = this.user$();
            if (user) {
                this.initTracking(user);
            } else {
                this.state.userId.set('');
                this.state.setTracking(null);
            }
        });
    }

    private initTracking(userId: string) {
        if (this.state.userId() === userId && this.state.getTrackingValue()) {
            return;
        }

        this.state.userId.set(userId);
        this.state.setLoadingTracking(true);

        const stored = this.storage.getTrackingStorage(this.state.userId());

        if (stored) {
            this.state.setTracking(stored);
            this.state.setLoadingTracking(false);
        } else {
            this.api
                .getTrackingByUser()
                .pipe(
                    takeUntilDestroyed(this.destroyRef),
                    finalize(() => this.state.setLoadingTracking(false)),
                )
                .subscribe((res) => {
                    if (!res) {
                        return;
                    }

                    this._persist(res);
                });
        }
    }

    createTracking(): Observable<TrackingVM | null | undefined> {
        const { start, end } = this.dateService.todayPlusDays(7);

        const payload: TrackingCreate = {
            startDate: start,
            endDate: end,
        };

        return this.api.createTracking(payload).pipe(
            tap((res) => {
                if (res !== undefined && res !== null) {
                    this.storage.setTrackingStorage(res, this.state.userId());
                    this.state.setTracking(res);
                }
            }),
            map(() => this.state.getTrackingValue()),
        );
    }

    createWorkout(dateWorkout: Date): Observable<WorkoutSessionVM | null | undefined> {
        const tracking = this.state.getTrackingValue();
        if (!tracking) return of(null);

        const workoutDraft = tracking.workouts?.find((w) =>
            this.dateService.isEqualDate(w.date, dateWorkout),
        );

        if (!workoutDraft) return of(null);

        this.state.loadingWorkoutCreation.update((current) => ({
            ...current,
            wokout: dateWorkout,
            state: true,
        }));

        const workoutPayload = {
            ...workoutDraft,
            planId: tracking.id,
        };

        return this.api.createWorkoutSession(workoutPayload, tracking.id!).pipe(
            takeUntilDestroyed(this.destroyRef),
            tap((res) => {
                if (res) {
                    // Actualizamos el workout en el estado con el ID y datos devueltos por la API
                    const newWorkout = { ...res, status: StatusWorkoutSessionEnum.COMPLETE };
                    this._updateWorkout(res.date, () => newWorkout);
                }
            }),
            finalize(() => {
                this.state.loadingWorkoutCreation.update((current) => ({
                    ...current,
                    state: false,
                }));
            }),
            switchMap((workoutRes) => {
                if (!workoutRes) return of(null);
                // Sincronizamos los días del tracking usando el ID del tracking actual
                return this.api.syncTrackingDays(tracking.id!).pipe(map(() => workoutRes));
            }),
        );
    }

    toggleExercise(date: Date, exercise: ExercisePerformanceVM) {
        this._updateWorkout(date, (workout) => {
            const exercises = workout.exercises || [];
            const exists = exercises.some((e) => e.exerciseId === exercise.exerciseId);

            return {
                ...workout,
                exercises: exists
                    ? exercises.filter((e) => e.exerciseId !== exercise.exerciseId)
                    : [...exercises, exercise],
            };
        });
    }

    removeExercise(date: Date, exerciseId: string) {
        this._updateWorkout(date, (workout) => ({
            ...workout,
            exercises: (workout.exercises || []).filter((e) => e.exerciseId !== exerciseId),
        }));
    }

    setWorkouts(day: Date, workout: WorkoutSessionVM) {
        this._updateWorkout(day, () => workout);
    }

    setExercises(date: Date, exercises: ExercisePerformanceVM[]) {
        this._updateWorkout(date, (workout) => ({ ...workout, exercises }));
    }

    setRestDay(day: Date, workout: WorkoutSessionVM) {
        const newWorkout =
            workout.status === StatusWorkoutSessionEnum.REST
                ? { ...workout, status: StatusWorkoutSessionEnum.NOT_STARTED }
                : { ...workout, status: StatusWorkoutSessionEnum.REST, exercises: [] };

        this._updateWorkout(day, () => newWorkout);
    }

    completeTracking(complete: boolean): Observable<TrackingVMS | null> {
        const current: TrackingVM | null = this.state.getTrackingValue();
        if (!current) return of(null);

        this.state.setLoading(true);

        const workoutDays: UpdateWeekLogDayInput[] = (current.workouts ?? []).map((w, i) => ({
            order: i + 1,
            workoutSessionId: w.id ?? undefined,
            extraSessionIds: [],
            status: w.id ? 'complete' : 'skipped',
        }));

        const totalDays = 7;
        const days: UpdateWeekLogDayInput[] = Array.from({ length: totalDays }, (_, i) => {
            const order = i + 1;
            const existing = workoutDays.find((d) => d.order === order);
            return existing ?? { order, status: 'skipped', extraSessionIds: [] };
        });

        const input: UpdateWeekLogInput = {
            id: current.id,
            completed: complete,
            notes: current.notes,
            ...(current.planId ? { planId: current.planId } : {}),
            startDate: this.dateService.formatDate(current.startDate),
            endDate: this.dateService.formatDate(current.endDate),
            days,
        };

        return this.api.updateTracking(input).pipe(
            takeUntilDestroyed(this.destroyRef),
            tap((res) => {
                if (res) {
                    this.storage.removeTrackingStorage(this.state.userId());
                }
            }),
            finalize(() => this.state.setLoading(false)),
        );
    }

    getWorkouts(): Observable<WorkoutSessionVM[]> {
        return this.state.tracking$.pipe(
            filter((tracking) => !!tracking),
            map((tracking) => tracking?.workouts || []),
        );
    }

    getExercises(workoutDate: Date): Observable<ExercisePerformanceVM[]> {
        return this.state.tracking$.pipe(
            filter((tracking) => !!tracking),
            map(
                (tracking) =>
                    tracking?.workouts?.filter((w) =>
                        this.dateService.isEqualDate(w.date, workoutDate),
                    ) || [],
            ),
            map((workouts) => workouts[0]?.exercises || []),
        );
    }

    getWorkout(date: Date): Observable<WorkoutSessionVM | undefined> {
        return this.state.tracking$.pipe(
            filter((tracking) => !!tracking),
            map((tracking) => tracking?.workouts || []),
            map((workouts) => workouts.find((w) => this.dateService.isEqualDate(w.date, date))),
        );
    }

    getExercise(date: Date, exerciseId: string): Observable<ExercisePerformanceVM | undefined> {
        return this.state.tracking$.pipe(
            filter((tracking) => !!tracking),
            map((tracking) => tracking?.workouts || []),
            map((workouts) => workouts.find((w) => this.dateService.isEqualDate(w.date, date))),
            map((workout) => workout?.exercises.find((e) => e.exerciseId === exerciseId)),
        );
    }

    private _updateWorkout(date: Date, updater: (w: WorkoutSessionVM) => WorkoutSessionVM) {
        this.state.updateWorkout(date, updater);
        const updated = this.state.getTrackingValue();
        if (updated) {
            this.storage.setTrackingStorage(updated, this.state.userId());
        }
    }

    private _persist(tracking: TrackingVM) {
        this.state.setTracking(tracking);
        this.storage.setTrackingStorage(tracking, this.state.userId());
    }
}
