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
    UpdateWeekLogDayUnifiedInput,
    UpdateWeekLogInput,
    UpdateWorkoutSessionInput,
} from '../../../shared/interfaces/api/tracking-api.interface';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
    emptyDay,
    wrapperExercisePerformanceVMToApi,
    wrapperWorkoutSessionVMtoUpdateWeekLogDayInput,
} from '../../../shared/wrappers/tracking.wrapper';
import { PlanTrackingApi } from './plan-tracking/api/plan-tranking.api';
import { WorkoutApi } from '../workouts/api/workout.api';
import {
    CreateExtraSessionContext,
    CreateExtraSessionForm,
    ExtraSession,
} from '../../../shared/interfaces/extra-session.interface';
import { mapToUpdateWeekLogExtraSessionInput } from '../../../shared/wrappers/extra-session.wrapper';

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

        const index = tracking.workouts?.findIndex((w) =>
            this.dateService.isEqualDate(w.date, dateWorkout),
        );

        if (index === undefined || index === -1) return of(null);
        const workoutDraft = tracking.workouts![index];

        const orderDay = this.state.tracking()?.workouts?.findIndex((w) => w.date === dateWorkout);
        // Usar el order real del día, no el índice
        const order = Number(orderDay) + 1;

        this.state.loadingWorkoutCreation.update((current) => ({
            ...current,
            wokout: dateWorkout,
            state: true,
        }));

        const payload: UpdateWeekLogDayUnifiedInput = {
            id: tracking.id!,
            days: [
                {
                    order,
                    isRest: false,
                    status: 'complete',
                    workoutSession: {
                        id: workoutDraft.id,
                        date: this.dateService.formatDate(workoutDraft.date),
                        status: StatusWorkoutSessionEnum.COMPLETE,
                        exercises: wrapperExercisePerformanceVMToApi(workoutDraft.exercises),
                        notes: workoutDraft.notes,
                    },
                },
            ],
        };

        return this.api.updateTrackingDay(payload).pipe(
            takeUntilDestroyed(this.destroyRef),
            tap((res) => {
                if (res) {
                    const updatedTracking = this.state.getTrackingValue();
                    if (updatedTracking?.workouts) {
                        const newWorkout = updatedTracking.workouts[index];
                        if (newWorkout) {
                            this._updateWorkout(newWorkout.date, () => ({
                                ...newWorkout,
                                status: StatusWorkoutSessionEnum.COMPLETE,
                            }));
                        }
                    }
                }
            }),
            finalize(() => {
                this.state.loadingWorkoutCreation.update((current) => ({
                    ...current,
                    state: false,
                }));
            }),
            map((res) => {
                if (!res?.workouts) return null;
                return res.workouts[index];
            }),
        );
    }

    createWorkoutWithRoutine(
        routineDayId: string,
        date: string,
    ): Observable<TrackingVM | null | undefined> {
        const tracking = this.state.getTrackingValue();
        if (!tracking) return of(null);

        return this.api.assignRoutineToDay(routineDayId, date).pipe(
            takeUntilDestroyed(this.destroyRef),
            tap((res) => {
                console.log(res);
                if (res !== undefined && res !== null) {
                    this._persist(res);
                }
            }),
            map(() => this.state.getTrackingValue()),
            tap((res) => console.log(res)),

            // switchMap((workoutRes) => {
            //     if (!workoutRes) return of(null);
            //     return this.api.syncTrackingDays(tracking.id!).pipe(map(() => workoutRes));
            // }),
        );
    }

    updateExtraSession(
        date: Date,
        extraSession: CreateExtraSessionForm,
    ): Observable<TrackingVM | null | undefined> {
        const tracking = this.state.getTrackingValue();
        if (!tracking) return of(null);

        // Buscar el día por fecha y tomar su order real
        const day = tracking.workouts?.find((d) => this.dateService.isEqualDate(d.date, date));

        if (!day) return of(null);

        let dayOrder: string | null = null;

        this.state.tracking()?.workouts?.forEach((d, index) => {
            if (this.dateService.isEqualDate(d.date, date)) {
                dayOrder = index.toString();
            }
        });

        if (dayOrder === null) return of(null);

        console.log(tracking, dayOrder, day);
        const payload: UpdateWeekLogDayUnifiedInput = {
            id: tracking.id!,
            days: [
                {
                    order: Number(dayOrder) + 1, // usar el order real del día, no el index
                    isRest: false,
                    extraSession: {
                        date: extraSession.date,
                        discipline: extraSession.discipline,
                        duration: extraSession.duration,
                        intensityLevel: extraSession.intensityLevel,
                        calories: extraSession.calories,
                        notes: extraSession.notes,
                    },
                },
            ],
        };

        console.log('updateExtraSession payload:', payload);

        return this.api.updateTrackingDay(payload).pipe(
            tap((res) => {
                if (res !== undefined && res !== null) {
                    this._persist(res);
                }
            }),
            map(() => this.state.getTrackingValue()),
        );
    }

    removeExtraSession(
        date: Date,
        extraSessionId: string,
    ): Observable<TrackingVM | null | undefined> {
        const tracking = this.state.getTrackingValue();
        if (!tracking) return of(null);

        // Buscar el día por fecha y tomar su order real
        const day = tracking.workouts?.find((d) => this.dateService.isEqualDate(d.date, date));

        if (!day) return of(null);

        let dayOrder: string | null = null;

        this.state.tracking()?.workouts?.forEach((d, index) => {
            if (this.dateService.isEqualDate(d.date, date)) {
                dayOrder = index.toString();
            }
        });

        return this.api.removeExtraSession(date, extraSessionId).pipe(
            tap((res) => {
                console.log(res);
                if (res !== undefined && res !== null) {
                    this._persist(res);
                }
            }),
            map(() => this.state.getTrackingValue()),
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
        console.log(exercises);
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

    removeWorkoutSession(date: Date, id: string): Observable<boolean> {
        return this.workoutApi.removeWorkoutSession(id).pipe(
            tap((success) => {
                if (success) {
                    this._updateWorkout(date, (workout) => ({
                        ...workout,
                        id: undefined,
                        status: StatusWorkoutSessionEnum.NOT_STARTED,
                        exercises: [],
                    }));
                }
            }),
        );
    }

    //add loading
    setRestDay(day: Date, workout: WorkoutSessionVM): Observable<TrackingVM | null> {
        const tracking = this.state.getTrackingValue();
        if (!tracking) return of(null);

        const isRest = workout.status !== StatusWorkoutSessionEnum.REST;

        const newWorkout = isRest
            ? { ...workout, status: StatusWorkoutSessionEnum.REST, exercises: [] }
            : { ...workout, status: StatusWorkoutSessionEnum.NOT_STARTED };

        let indexDay: number | null = null;

        this.state.tracking()?.workouts?.forEach((d, index) => {
            if (this.dateService.isEqualDate(d.date, day)) {
                indexDay = index;
            }
        });

        if (indexDay === null) return of(null);

        this._updateWorkout(day, () => newWorkout);

        return this.api
            .updateTrackingDay({
                id: tracking.id!,
                days: [
                    {
                        order: indexDay + 1,
                        isRest: isRest,
                        status: isRest ? 'skipped' : 'pending',
                    },
                ],
            })
            .pipe(
                tap((res) => {
                    if (res) {
                        this._persist(res);
                    }
                }),
            );
    }

    completeTracking(complete: boolean): Observable<TrackingVMS | null> {
        const current: TrackingVM | null = this.state.getTrackingValue();
        if (!current || !current.workouts) return of(null);

        this.state.setLoading(true);

        const workoutDays = wrapperWorkoutSessionVMtoUpdateWeekLogDayInput(current.workouts);

        const totalDays = 7;
        const days = emptyDay(workoutDays, totalDays);

        const input: UpdateWeekLogDayUnifiedInput = this.transformUpdateWeekLogInputUnified(
            days,
            current,
            complete,
        );

        return this.api
            .updateTracking(this.transformUpdateWeekLogInput(days, current, complete))
            .pipe(
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

    private transformUpdateWeekLogInputUnified(
        days: UpdateWeekLogDayInput[],
        current: TrackingVM,
        complete: boolean,
    ): UpdateWeekLogDayUnifiedInput {
        return {
            id: current.id,
            days: days.map((day) => ({
                order: day.order,
                status: day.status,
                isRest: day.isRest ?? false,
                workoutSession: day.workoutSession,
            })),
        };
    }

    createRoutineFromWorkout(title: string, exerciseIds: string[]): Observable<any> {
        return this.api.createRoutineByWorkout(title, exerciseIds);
    }
}
