import { DestroyRef, effect, inject, Injectable } from '@angular/core';
import { PlanTrackingStorage } from './plan-tracking/storage/plan-tracking.storage';
import { PlanTrackingStateService } from './plan-tracking.state';
import { finalize, map, Observable, of, tap } from 'rxjs';
import {
    ExercisePerformanceVM,
    LocalDate,
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
import { RoutineDayAPI } from '../../../shared/interfaces/api/routines-api.interface';

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
                this.initTracking();
            } else {
                this.state.userId.set('');
                this.state.setTracking(null);
            }
        });
    }

    initTracking(): Observable<TrackingVM | null | undefined> {
        return this.api.getTrackingByUser();
    }

    findAllTrackingByUser(limit = 5, offset = 0): Observable<TrackingVM[] | null> {
        return this.api.findAllTrackingByUser(limit, offset);
    }

    findById(id: string): Observable<TrackingVM | null> {
        return this.api.findById(id);
    }

    createTracking(planId?: string): Observable<TrackingVM | null | undefined> {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const { start, end } = this.dateService.todayWeekRange(timezone); // ✅ LocalDate range

        const payload: TrackingCreate = {
            startDate: start, // ✅ LocalDate "yyyy-MM-dd"
            endDate: end, // ✅ LocalDate "yyyy-MM-dd"
            timezone, // ✅ IANA timezone del browser
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
        dateWorkout: LocalDate, // ✅ LocalDate "yyyy-MM-dd"
    ): Observable<{ index: number; workoutDraft: WorkoutSessionVM } | null> {
        const tracking = this.state.getTrackingValue();
        if (!tracking) return of(null);

        const index = tracking.workouts?.findIndex(
            (w) => this.dateService.isSameLocalDate(w.date, dateWorkout), // ✅ string comparison
        );

        if (index === undefined || index === -1) return of(null);
        const workoutDraft = tracking.workouts![index];
        const order = Number(index) + 1;

        this.state.loadingWorkoutCreation.update((current) => ({
            ...current,
            date: dateWorkout,
            state: true,
        }));

        const payload: UpdateWeekLogDayUnifiedInput = {
            id: tracking.id!,
            timezone: this.dateService.getUserTimezone(),
            days: [
                {
                    order,
                    isRest: false,
                    status: 'complete',
                    workoutSession: {
                        id: workoutDraft.id,
                        date: workoutDraft.date, // ✅ ya es LocalDate — sin conversión
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
        date: LocalDate, // ✅ LocalDate "yyyy-MM-dd"
    ): Observable<WeekLogDayVM | null | undefined> {
        const tracking = this.state.getTrackingValue();
        if (!tracking) return of(null);

        return this.api.assignRoutineToDay(routineDayId, date);
    }

    updateExtraSession(
        date: LocalDate, // ✅ LocalDate "yyyy-MM-dd"
        extraSession: CreateExtraSessionForm,
    ): Observable<WeekLogDayVM | null | undefined> {
        const tracking = this.state.getTrackingValue();
        if (!tracking) return of(null);

        const day = tracking.workouts?.find((d) => this.dateService.isSameLocalDate(d.date, date));

        if (!day) return of(null);

        let dayOrder: string | null = null;

        this.state.tracking()?.workouts?.forEach((d, index) => {
            if (this.dateService.isSameLocalDate(d.date, date)) {
                dayOrder = index.toString();
            }
        });

        if (dayOrder === null) return of(null);

        console.log(extraSession.date);

        const payload: UpdateWeekLogDayUnifiedInput = {
            id: tracking.id!,
            timezone: this.dateService.getUserTimezone(),
            days: [
                {
                    order: Number(dayOrder) + 1,
                    isRest: false,
                    extraSession: {
                        date: extraSession.date, // ✅ ya es LocalDate
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
        date: LocalDate, // ✅ LocalDate string
        extraSessionId: string,
    ): Observable<WeekLogDayVM | null | undefined> {
        const tracking = this.state.getTrackingValue();
        if (!tracking) return of(null);

        const day = tracking.workouts?.find((d) => this.dateService.isSameLocalDate(d.date, date));

        if (!day) return of(null);

        return this.api.removeExtraSession(date, extraSessionId);
    }

    updateWorkoutSession(date: LocalDate, workout: WorkoutSessionVM) {
        const tracking = this.state.getTrackingValue();
        if (!tracking) return;

        return this.workoutApi.updateWorkoutSession(workout, tracking.id!).pipe(
            finalize(() => {
                this.state.setLoadingTracking(false);
            }),
        );
    }

    updateExercises(
        dateWorkout: LocalDate,
        exercises: ExercisePerformanceVM[],
    ): Observable<WeekLogDayVM | null> {
        const tracking = this.state.getTrackingValue();
        if (!tracking) return of(null);

        const index = tracking.workouts?.findIndex((w) =>
            this.dateService.isSameLocalDate(w.date, dateWorkout),
        );

        if (index === undefined || index === -1) return of(null);
        const order = Number(index) + 1;

        const payload: UpdateWeekLogDayUnifiedInput = {
            id: tracking.id!,
            timezone: this.dateService.getUserTimezone(),
            days: [
                {
                    order,
                    isRest: false,
                    workoutSession: {
                        date: dateWorkout,
                        exercises: wrapperExercisePerformanceVMToApi(exercises),
                        status: tracking.workouts![index].status,
                    },
                },
            ],
        };

        return this.api.updateTrackingDay(payload);
    }

    removeWorkoutSession(
        date: LocalDate, // ✅ LocalDate string
        workoutSessionId: string,
    ): Observable<WeekLogDayVM | null | undefined> {
        return this.api.removeWorkoutSession(date, workoutSessionId);
    }

    setRestDay(date: LocalDate, isRest: boolean): Observable<WeekLogDayVM | null> {
        return this.api.updateDayWorkoutStatus(date, isRest);
    }

    completeTracking(complete: boolean): Observable<TrackingVMS | null> {
        const current: TrackingVM | null = this.state.getTrackingValue();
        if (!current || !current.workouts) return of(null);

        this.state.setLoading(true);

        const workoutDays = wrapperWorkoutSessionVMtoUpdateWeekLogDayInput(current.workouts);

        const totalDays = 7;
        const days = emptyDay(workoutDays, totalDays);

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
                finalize(() => this.state.setLoading(false)),
            );
    }

    private transformUpdateWeekLogInput(
        days: UpdateWeekLogDayInput[],
        current: TrackingVM,
        complete: boolean,
    ): UpdateWeekLogInput {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        return {
            id: current.id,
            completed: complete,
            active: false,
            notes: current.notes,
            startDate: current.startDate, // ✅ ya es LocalDate
            endDate: current.endDate, // ✅ ya es LocalDate
            timezone,
            days,
        };
    }

    createRoutineFromWorkout(
        title: string,
        exerciseIds: string[],
    ): Observable<RoutineDayAPI | null> {
        return this.api.createRoutineByWorkout(title, exerciseIds).pipe(
            tap(() => {
                this.routineService
                    .updateAllRoutines()
                    .pipe(takeUntilDestroyed(this.destroyRef))
                    .subscribe();
            }),
        );
    }

    removeTracking(id: string): Observable<boolean> {
        return this.api.removeTracking(id).pipe(
            tap((success) => {
                if (success) {
                    const current = this.state.getTrackingValue();
                    if (current?.id === id) {
                        this.storage.removeTrackingStorage(this.state.userId());
                        this.state.setTracking(null);
                    }
                }
            }),
        );
    }
}
