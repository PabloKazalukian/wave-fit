import { DestroyRef, effect, inject, Injectable } from '@angular/core';
import { PlanTrackingStorage } from './plan-tracking/storage/plan-tracking.storage';
import { PlanTrackingStateService } from './plan-tracking.state';
import { delay, finalize, map, Observable, of, switchMap, tap } from 'rxjs';
import {
    ExercisePerformanceVM,
    StatusWorkoutSession,
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
import {
    emptyDay,
    wrapperWorkoutSessionVMtoUpdateWeekLogDayInput,
} from '../../../shared/wrappers/tracking.wrapper';
import { PlanTrackingApi } from './plan-tracking/api/plan-tranking.api';
import { WorkoutApi } from '../workouts/api/workout.api';

@Injectable({
    providedIn: 'root',
})
export class PlanTrackingDomainService {
    destroyRef = inject(DestroyRef);

    private api = inject(PlanTrackingApi);
    private workoutApi = inject(WorkoutApi);
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

    findAllTrackingByUser(): Observable<TrackingVM[] | null> {
        return this.api.findAllTrackingByUser();
    }

    findById(id: string): Observable<TrackingVM | null> {
        return this.api.findById(id);
    }

    createTracking(planId?: string): Observable<TrackingVM | null | undefined> {
        const { start, end } = this.dateService.todayPlusDays(7);

        const payload: TrackingCreate = {
            startDate: start,
            endDate: end,
            planId,
        };

        return this.api.createTracking(payload).pipe(
            tap((res) => {
                if (res !== undefined && res !== null) {
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

        return this.workoutApi.createWorkoutSession(workoutPayload, tracking.id!).pipe(
            takeUntilDestroyed(this.destroyRef),
            tap((res) => {
                if (res) {
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
                return this.api.syncTrackingDays(tracking.id!).pipe(map(() => workoutRes));
            }),
        );
    }

    createWorkoutWithRoutine(
        routineDayId: string,
        date: string,
    ): Observable<WorkoutSessionVM | null | undefined> {
        const tracking = this.state.getTrackingValue();
        if (!tracking) return of(null);

        this.state.loadingWorkoutCreation.update((current) => ({
            ...current,
            state: true,
        }));

        return this.workoutApi.assignRoutineToDay(routineDayId, date).pipe(
            takeUntilDestroyed(this.destroyRef),
            tap((res) => {
                if (res) {
                    const newWorkout = { ...res, status: StatusWorkoutSessionEnum.COMPLETE };
                    this._updateWorkout(new Date(date), () => newWorkout);
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

    setRemoveAllExercises(date: Date, workout: WorkoutSessionVM) {
        this._updateWorkout(date, (workout) => ({
            ...workout,
            exercises: [],
        }));
    }

    setWorkouts(day: Date, workout: WorkoutSessionVM) {
        this._updateWorkout(day, () => workout);
    }

    setExercises(date: Date, exercises: ExercisePerformanceVM[]) {
        this._updateWorkout(date, (workout) => ({ ...workout, exercises }));
    }

    updateWorkoutStatus(date: Date, status: StatusWorkoutSession) {
        const tracking = this.state.getTrackingValue();
        if (!tracking) return;

        // Update local cache
        this._updateWorkout(date, (workout) => ({ ...workout, status }));
    }

    updateWorkoutSession(date: Date, workout: WorkoutSessionVM) {
        const tracking = this.state.getTrackingValue();
        if (!tracking) return;

        // Call API
        this.workoutApi.updateWorkoutSession(workout, tracking.id!).subscribe();

        // Update local cache
        this._updateWorkout(date, () => workout);
    }

    removeWorkoutSession(date: Date, id: string) {
        this.workoutApi.removeWorkoutSession(id).subscribe((success) => {
            if (success) {
                this._updateWorkout(date, (workout) => ({
                    ...workout,
                    id: undefined,
                    status: StatusWorkoutSessionEnum.NOT_STARTED,
                    exercises: [],
                }));
            }
        });
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
        if (!current || !current.workouts) return of(null);

        this.state.setLoading(true);

        const workoutDays = wrapperWorkoutSessionVMtoUpdateWeekLogDayInput(current.workouts);

        const totalDays = 7;
        const days = emptyDay(workoutDays, totalDays);

        const input: UpdateWeekLogInput = this.transformUpdateWeekLogInput(days, current, complete);

        return this.api.updateTracking(input).pipe(
            takeUntilDestroyed(this.destroyRef),
            tap((res) => {
                if (res) {
                    this.storage.removeTrackingStorage(this.state.userId());
                    this.state.setTracking(null);
                }
            }),
            delay(2000),
            finalize(() => this.state.setLoading(false)),
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

    private transformUpdateWeekLogInput(
        days: UpdateWeekLogDayInput[],
        current: TrackingVM,
        complete: boolean,
    ): UpdateWeekLogInput {
        return {
            id: current.id,
            completed: complete,
            active: false,
            userId: this.state.userId(),
            notes: current.notes,
            ...(current.planId ? { planId: current.planId } : {}),
            startDate: this.dateService.formatDate(current.startDate),
            endDate: this.dateService.formatDate(current.endDate),
            days,
        };
    }
}
