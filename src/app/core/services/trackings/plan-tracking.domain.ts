import { DestroyRef, effect, inject, Injectable } from '@angular/core';
import { PlanTrackingStorage } from './plan-tracking/storage/plan-tracking.storage';
import { PlanTrackingStateService } from './plan-tracking.state';
import { delay, finalize, map, Observable, of, tap } from 'rxjs';
import {
    ExercisePerformanceVM,
    StatusWorkoutSession,
    StatusWorkoutSessionEnum,
    TrackingVM,
    TrackingVMS,
    WeekLogDayVM,
    WorkoutSessionVM,
} from '../../../shared/interfaces/tracking.interface';
import { DateService } from '../date.service';
import { AuthService } from '../auth/auth.service';
import {
    TrackingCreate,
    UpdateWeekLogDayInput,
    UpdateWeekLogDayUnifiedInput,
    UpdateWeekLogInput,
} from '../../../shared/interfaces/api/tracking-api.interface';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
    emptyDay,
    wrapperExercisePerformanceVMToApi,
    wrapperWorkoutSessionVMtoUpdateWeekLogDayInput,
    wrapperWeekLogDayVMToWorkoutSessionVM,
} from '../../../shared/wrappers/tracking.wrapper';
import { PlanTrackingApi } from './plan-tracking/api/plan-tranking.api';
import { WorkoutApi } from '../workouts/api/workout.api';
import { CreateExtraSessionForm } from '../../../shared/interfaces/extra-session.interface';
import { RoutinesService } from '../routines/routines.service';

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
    private routineService = inject(RoutinesService);
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

    initTracking(userId: string): Observable<TrackingVM | null | undefined> {
        return this.api.getTrackingByUser();
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

    createWorkout(
        dateWorkout: Date,
    ): Observable<{ index: number; workoutDraft: WorkoutSessionVM } | null> {
        const tracking = this.state.getTrackingValue();
        if (!tracking) return of(null);

        const index = tracking.workouts?.findIndex((w) =>
            this.dateService.isSameDay(w.date, dateWorkout),
        );

        if (index === undefined || index === -1) return of(null);
        const workoutDraft = tracking.workouts![index];
        const order = Number(index) + 1;

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
            map((res) => {
                if (!res) return null;
                return { index, workoutDraft: wrapperWeekLogDayVMToWorkoutSessionVM(res) };
            }),
            finalize(() => {
                this.state.loadingWorkoutCreation.update((current) => ({
                    ...current,
                    state: false,
                }));
            }),
        );
    }

    createWorkoutWithRoutine(
        routineDayId: string,
        date: string,
    ): Observable<WeekLogDayVM | null | undefined> {
        const tracking = this.state.getTrackingValue();
        if (!tracking) return of(null);

        return this.api.assignRoutineToDay(routineDayId, date);
    }

    updateExtraSession(
        date: Date,
        extraSession: CreateExtraSessionForm,
    ): Observable<WeekLogDayVM | null | undefined> {
        const tracking = this.state.getTrackingValue();
        if (!tracking) return of(null);

        // Buscar el día por fecha y tomar su order real
        const day = tracking.workouts?.find((d) => this.dateService.isSameDay(d.date, date));

        if (!day) return of(null);

        let dayOrder: string | null = null;

        this.state.tracking()?.workouts?.forEach((d, index) => {
            if (this.dateService.isSameDay(d.date, date)) {
                dayOrder = index.toString();
            }
        });

        if (dayOrder === null) return of(null);

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

        return this.api.updateTrackingDay(payload);
    }

    removeExtraSession(
        date: Date,
        extraSessionId: string,
    ): Observable<WeekLogDayVM | null | undefined> {
        const tracking = this.state.getTrackingValue();
        if (!tracking) return of(null);

        // Buscar el día por fecha y tomar su order real
        const day = tracking.workouts?.find((d) => this.dateService.isSameDay(d.date, date));

        if (!day) return of(null);

        return this.api.removeExtraSession(date, extraSessionId);
    }

    updateWorkoutSession(date: Date, workout: WorkoutSessionVM) {
        const tracking = this.state.getTrackingValue();
        if (!tracking) return;

        // Call API
        return this.workoutApi.updateWorkoutSession(workout, tracking.id!).pipe(
            finalize(() => {
                this.state.setLoadingTracking(false);
            }),
        );

        // Update local cache
    }

    removeWorkoutSession(
        date: Date,
        workoutSessionId: string,
    ): Observable<WeekLogDayVM | null | undefined> {
        return this.api.removeWorkoutSession(date, workoutSessionId);
    }

    //add loading
    setRestDay(date: string, isRest: boolean): Observable<WeekLogDayVM | null> {
        // this.state.setLoading(true);

        return this.api.updateDayWorkoutStatus(date, isRest);
        // .pipe(finalize(() => this.state.setLoading(false)));
    }

    completeTracking(complete: boolean): Observable<TrackingVMS | null> {
        const current: TrackingVM | null = this.state.getTrackingValue();
        if (!current || !current.workouts) return of(null);

        this.state.setLoading(true);

        const workoutDays = wrapperWorkoutSessionVMtoUpdateWeekLogDayInput(current.workouts);

        const totalDays = 7;
        const days = emptyDay(workoutDays, totalDays);

        // const input: UpdateWeekLogDayUnifiedInput = this.transformUpdateWeekLogInputUnified(
        //     days,
        //     current,
        //     complete,
        // );

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

    private transformUpdateWeekLogInput(
        days: UpdateWeekLogDayInput[],
        current: TrackingVM,
        complete: boolean,
    ): UpdateWeekLogInput {
        return {
            id: current.id,
            completed: complete,
            active: false,
            notes: current.notes,
            startDate: this.dateService.formatDate(current.startDate),
            endDate: this.dateService.formatDate(current.endDate),
            days,
        };
    }

    //reset routine s
    createRoutineFromWorkout(title: string, exerciseIds: string[]): Observable<any> {
        return this.api.createRoutineByWorkout(title, exerciseIds).pipe(
            tap((res) => {
                this.routineService
                    .updateAllRoutines()
                    .pipe(takeUntilDestroyed(this.destroyRef))
                    .subscribe();
            }),
        );
    }
}
