import { DestroyRef, effect, inject, Injectable } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { debounceTime, filter, finalize, map, Observable, Subject, tap } from 'rxjs';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
    ExercisePerformanceVM,
    LocalDate,
    StatusWorkoutSession,
    StatusWorkoutSessionEnum,
    WorkoutSessionVM,
} from '../../../shared/interfaces/tracking.interface';
import { DayLogVM } from '../../../shared/interfaces/day-log.interface';
import { CreateExtraSessionForm } from '../../../shared/interfaces/extra-session.interface';
import { RoutineDayAPI } from '../../../shared/interfaces/api/routines-api.interface';
import { PlanDayDomainService } from './plan-day.domain';
import { PlanDayStateService } from './plan-day.state';
import { PlanDayStorage } from './plan-day/storage/plan-day.storage';

@Injectable({
    providedIn: 'root',
})
export class PlanDayService {
    destroyRef = inject(DestroyRef);

    private domain = inject(PlanDayDomainService);
    private state = inject(PlanDayStateService);
    private storage = inject(PlanDayStorage);
    private authService = inject(AuthService);

    // readonly dayLog = this.state.dayLog;
    readonly dayLog$ = this.state.dayLog$;
    readonly loading = this.state.loading;
    readonly loadingDayLog = this.state.loadingDayLog;
    readonly loadingWorkoutCreation = this.state.loadingWorkoutCreation;
    readonly loadingStatusWorkout = this.state.loadingStatusWorkout;

    user$ = toSignal(this.authService.user$);
    private exercisesUpdate$ = new Subject<{ exercises: ExercisePerformanceVM[] }>();

    constructor() {
        effect(() => {
            const user = this.user$();
            if (user) {
                this.initDayLog(user);
            } else {
                this.state.userId.set('');
                this.state.setDayLog(null);
            }
        });

        this.exercisesUpdate$
            .pipe(debounceTime(4000), takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: ({ exercises }) => {
                    this.domain.updateExercises(exercises).subscribe({
                        error: (err) =>
                            console.error('Error al persistir los ejercicios del día:', err),
                    });
                },
            });
    }

    private initDayLog(userId: string) {
        if (this.state.userId() === userId && this.state.getDayLogValue()) {
            return;
        }

        this.state.userId.set(userId);
        this.state.setLoadingDayLog(true);

        this.domain
            .initActiveLog()
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                finalize(() => this.state.setLoadingDayLog(false)),
            )
            .subscribe();
    }

    private _persist(dayLog: DayLogVM) {
        this.state.setDayLog(dayLog);
        this.storage.setDayLogStorage(dayLog, dayLog.userId);
    }

    createDayLog(
        planId?: string,
        date?: LocalDate,
        routineDayId?: string,
    ): Observable<DayLogVM | null> {
        return this.domain.createDayLog(planId, date, routineDayId).pipe(
            tap((res) => {
                if (res) this._persist(res);
            }),
        );
    }

    reloadDayLog(): Observable<DayLogVM | null> {
        const userId = this.authService.user()?.id ?? this.state.userId();
        this.state.userId.set(userId);
        this.state.setLoadingDayLog(true);

        return this.domain.initDayLog().pipe(
            takeUntilDestroyed(this.destroyRef),
            finalize(() => this.state.setLoadingDayLog(false)),
        );
    }

    createWorkoutWithRoutine(routineDayId: string, date: LocalDate): Observable<DayLogVM | null> {
        return this.domain.createWorkoutWithRoutine(routineDayId, date).pipe(
            tap((res) => {
                if (res) this._persist(res);
            }),
        );
    }

    findAll(limit = 5, offset = 0) {
        return this.domain.findAllDayLogs(limit, offset);
    }

    findById(id: string): Observable<DayLogVM | null> {
        return this.domain.findById(id);
    }

    setExercises(exercises: ExercisePerformanceVM[]) {
        const dayLog = this.state.getDayLogValue();
        if (dayLog) {
            this.state.updateDayLog((d) => ({ ...d, exercises }));
        }
        this.exercisesUpdate$.next({ exercises });
    }

    setRestDay(day: LocalDate, isRest: boolean): Observable<DayLogVM | null> {
        this.state.setLoadingStatusWorkout(true);
        return this.domain.setRestDay(day, isRest).pipe(
            tap((res) => {
                if (res) this._persist(res);
            }),
            finalize(() => this.state.setLoadingStatusWorkout(false)),
        );
    }

    removeExtraSession(extraSessionId: string): Observable<DayLogVM | null> {
        return this.domain.removeExtraSession(extraSessionId).pipe(
            tap((res) => {
                if (res) this._persist(res);
            }),
        );
    }

    updateExtraSession(extraSession: CreateExtraSessionForm): Observable<DayLogVM | null> {
        return this.domain.updateExtraSession(extraSession).pipe(
            tap((res) => {
                if (res) this._persist(res);
            }),
        );
    }

    updateWorkoutStatus(status: StatusWorkoutSession) {
        const dayLog = this.state.getDayLogValue();
        if (!dayLog) return;
        this.state.updateDayLog((d) => ({ ...d, status: status as DayLogVM['status'] }));
    }

    updateWorkoutSession(workout: WorkoutSessionVM): void {
        this.domain
            .updateWorkoutSession(workout)
            ?.pipe(
                takeUntilDestroyed(this.destroyRef),
                finalize(() => {
                    const dayLog = this.state.getDayLogValue();
                    if (dayLog) {
                        this.state.updateDayLog((d) => ({ ...d, exercises: workout.exercises }));
                    }
                }),
            )
            .subscribe();
    }

    get getWorkouts(): Observable<WorkoutSessionVM[]> {
        return this.state.dayLog$.pipe(
            filter((dayLog) => !!dayLog),
            map((dayLog) => {
                if (!dayLog) return [];
                return [
                    {
                        id: dayLog.workoutSessionId,
                        date: dayLog.date,
                        exercises: dayLog.exercises ?? [],
                        extras: dayLog.extraSessionIds,
                        status:
                            dayLog.status === 'skipped'
                                ? StatusWorkoutSessionEnum.REST
                                : dayLog.status === 'complete'
                                  ? StatusWorkoutSessionEnum.COMPLETE
                                  : StatusWorkoutSessionEnum.NOT_STARTED,
                    },
                ];
            }),
        );
    }

    getExercises(): Observable<ExercisePerformanceVM[]> {
        return this.state.dayLog$.pipe(
            filter((dayLog) => !!dayLog),
            map((dayLog) => dayLog?.exercises ?? []),
        );
    }

    getWorkout(): Observable<WorkoutSessionVM | undefined> {
        return this.state.dayLog$.pipe(
            filter((dayLog) => !!dayLog),
            map((dayLog) => {
                if (!dayLog) return undefined;
                return {
                    id: dayLog.workoutSessionId,
                    date: dayLog.date,
                    exercises: dayLog.exercises ?? [],
                    extras: dayLog.extraSessionIds,
                    status:
                        dayLog.status === 'skipped'
                            ? StatusWorkoutSessionEnum.REST
                            : dayLog.status === 'complete'
                              ? StatusWorkoutSessionEnum.COMPLETE
                              : StatusWorkoutSessionEnum.NOT_STARTED,
                };
            }),
        );
    }

    getExercise(exerciseId: string): Observable<ExercisePerformanceVM | undefined> {
        return this.state.dayLog$.pipe(
            filter((dayLog) => !!dayLog),
            map((dayLog) => dayLog?.exercises?.find((e) => e.exerciseId === exerciseId)),
        );
    }

    setRemoveAllExercises(): void {
        this.state.updateDayLog((d) => ({ ...d, exercises: [] }));
        this.exercisesUpdate$.next({ exercises: [] });
    }

    removeWorkoutSession(workoutSessionId: string): Observable<DayLogVM | null> {
        this.state.setLoadingStatusWorkout(true);
        return this.domain
            .removeWorkoutSession(workoutSessionId)
            .pipe(finalize(() => this.state.setLoadingStatusWorkout(false)));
    }

    createRoutineFromWorkout(
        title: string,
        exerciseIds: string[],
    ): Observable<RoutineDayAPI | null> {
        return this.domain.createRoutineFromWorkout(title, exerciseIds);
    }

    completeDayLog(complete: boolean): Observable<DayLogVM | null> {
        return this.domain.completeDayLog(complete);
    }

    removeDayLog(id: string): Observable<boolean> {
        return this.domain.removeDayLog(id);
    }
}
