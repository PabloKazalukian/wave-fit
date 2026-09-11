import { inject, Injectable } from '@angular/core';
import {
    concatMap,
    finalize,
    first,
    firstValueFrom,
    from,
    map,
    Observable,
    of,
    switchMap,
    tap,
} from 'rxjs';
import {
    ExercisePerformanceVM,
    LocalDate,
    StatusWorkoutSessionEnum,
    WorkoutSessionVM,
} from '../../../shared/interfaces/tracking.interface';
import { DayLogSummaryVM, DayLogVM } from '../../../shared/interfaces/day-log.interface';
import { CreateExtraSessionForm } from '../../../shared/interfaces/extra-session.interface';
import { DateService } from '../date.service';
import { NetworkStatusService } from '../network/network-status.service';
import { SyncQueueService } from '../sync/sync-queue.service';
import { RoutinesService } from '../routines/routines.service';
import { RoutineDayAPI } from '../../../shared/interfaces/api/routines-api.interface';
import { PlanDayApi } from './plan-day/api/plan-day.api';
import { ActiveTrackingService } from '../trackings/active-tracking.service';
import { PlanDayStateService } from './plan-day.state';
import { PlanDayStorage } from './plan-day/storage/plan-day.storage';
import { CreateDayLogInput, UpdateDayLogInput } from '../../../shared/interfaces/api/day-log-api.interface';

@Injectable({
    providedIn: 'root',
})
export class PlanDayDomainService {
    private api = inject(PlanDayApi);
    private activeTrackingSvc = inject(ActiveTrackingService);
    private state = inject(PlanDayStateService);
    private storage = inject(PlanDayStorage);
    private dateService = inject(DateService);
    private routineService = inject(RoutinesService);
    private networkSvc = inject(NetworkStatusService);
    private syncQueue = inject(SyncQueueService);

    constructor() {
        this.syncQueue.registerHandler('UpdateDayLog', async (mutation) => {
            const workout = mutation.variables.workout as WorkoutSessionVM;
            const res = await firstValueFrom(this.api.updateWorkoutSession(workout));
            return res;
        });
    }

    private generateObjectId(): string {
        const timestamp = Math.floor(new Date().getTime() / 1000).toString(16);
        const randomHex = 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, () =>
            Math.floor(Math.random() * 16).toString(16),
        );
        return (timestamp + randomHex).toLowerCase();
    }

    /**
     * Fuente de verdad: ActiveTrackingService. Si type === 'DAY_LOG' carga el day-log activo.
     */
    initActiveLog(): Observable<{ hasActive: boolean; type: 'WEEK_LOG' | 'DAY_LOG' }> {
        return this.activeTrackingSvc.activeTracking$.pipe(
            first((active) => !!active),
            tap((active) => {
                if (active.hasActive && active.type === 'DAY_LOG') {
                    this.state.setLoadingDayLog(true);
                    this.api
                        .getActiveDayLog()
                        .pipe(finalize(() => this.state.setLoadingDayLog(false)))
                        .subscribe((dayLog) => {
                            if (dayLog) {
                                this.state.setDayLog(dayLog);
                                this.storage.setDayLogStorage(dayLog, dayLog.userId);
                            } else {
                                this.state.setDayLog(null);
                            }
                        });
                } else {
                    this.state.setDayLog(null);
                }
            }),
            map((active) => ({
                hasActive: active.hasActive,
                type: active.type,
            })),
        );
    }

    initDayLog(): Observable<DayLogVM | null> {
        return this.api.getActiveDayLog().pipe(
            tap((dayLog) => {
                if (dayLog) {
                    this.state.setDayLog(dayLog);
                    this.storage.setDayLogStorage(dayLog, dayLog.userId);
                } else {
                    this.state.setDayLog(null);
                }
            }),
            map(() => this.state.getDayLogValue()),
        );
    }

    findAllDayLogs(limit = 5, offset = 0): Observable<DayLogSummaryVM[] | null> {
        return this.api.findAllDayLogs(limit, offset);
    }

    findById(id: string): Observable<DayLogVM | null> {
        return this.api.findDayLogById(id);
    }

    createDayLog(
        planId?: string,
        date?: LocalDate,
        routineDayId?: string,
    ): Observable<DayLogVM | null> {
        const timezone = this.dateService.getUserTimezone();
        const payload: CreateDayLogInput = {
            date: date ?? this.dateService.todayLocalDate(timezone),
            timezone,
            planId,
            routineDayId,
        };

        return this.api.createDayLog(payload).pipe(
            tap((res) => {
                if (res) {
                    this.state.setDayLog(res);
                    this.storage.setDayLogStorage(res, res.userId);
                }
            }),
            map(() => this.state.getDayLogValue()),
        );
    }

    createWorkoutWithRoutine(routineDayId: string, date: LocalDate): Observable<DayLogVM | null> {
        const dayLog = this.state.getDayLogValue();
        if (!dayLog) return of(null);

        return this.api.assignRoutineToDayLog(routineDayId, date).pipe(
            concatMap((res) => {
                // La mutation day-log no devuelve los exercises del workout (solo
                // id/routineDayId/workoutSessionId). Re-fetch del day-log activo para
                // traer el WS completo (con exercises) y reflejarlo en la UI.
                if (!res?.workoutSessionId) return of(null);
                return this.api.getActiveDayLog();
            }),
            tap((res) => {
                if (res) {
                    this.state.setDayLog(res);
                    this.storage.setDayLogStorage(res, res.userId);
                }
            }),
            map(() => this.state.getDayLogValue()),
        );
    }

    updateExercises(exercises: ExercisePerformanceVM[]): Observable<DayLogVM | null> {
        const dayLog = this.state.getDayLogValue();
        if (!dayLog) return of(null);

        // Materializar el WorkoutSession si el day-log aún no tiene uno
        // (ej: día creado sin rutina). updateDayLogStatus con isRest=false crea el WS
        // en el servidor y devuelve el dayLog con workoutSessionId asignado.
        const ensureWorkoutSession: Observable<DayLogVM | null> = dayLog.workoutSessionId
            ? of(dayLog)
            : this.networkSvc.isOnline()
              ? this.setRestDay(dayLog.date, false).pipe(
                    tap((res) => {
                        if (res?.workoutSessionId) {
                            this.state.updateDayLog((d) => ({ ...d, exercises }));
                        }
                    }),
                )
              : of(null);

        return ensureWorkoutSession.pipe(
            switchMap((current) => {
                if (!current?.workoutSessionId) return of(null);

                const workout: WorkoutSessionVM = {
                    id: current.workoutSessionId,
                    date: current.date,
                    exercises,
                    status: this.workoutStatusFromDay(current),
                };

                if (this.networkSvc.isOnline()) {
                    return this.api.updateWorkoutSession(workout).pipe(
                        tap((res) => {
                            if (res) {
                                this.state.updateDayLog((d) => ({
                                    ...d,
                                    exercises: res.exercises,
                                }));
                            }
                        }),
                        map(() => this.state.getDayLogValue()),
                    );
                } else {
                    const pending = {
                        id: this.generateObjectId(),
                        operationName: 'UpdateDayLog',
                        variables: { workout },
                        status: 'pending' as const,
                        createdAt: Date.now(),
                    };

                    return from(
                        this.syncQueue.enqueue(pending).then(() => this.state.getDayLogValue()),
                    );
                }
            }),
        );
    }

    private workoutStatusFromDay(dayLog: DayLogVM): StatusWorkoutSessionEnum {
        if (dayLog.status === 'complete') return StatusWorkoutSessionEnum.COMPLETE;
        if (dayLog.status === 'skipped') return StatusWorkoutSessionEnum.REST;
        return StatusWorkoutSessionEnum.NOT_STARTED;
    }

    updateExtraSession(extraSession: CreateExtraSessionForm): Observable<DayLogVM | null> {
        const dayLog = this.state.getDayLogValue();
        if (!dayLog) return of(null);

        const payload: UpdateDayLogInput = {
            id: dayLog.id,
            extraSession: {
                date: extraSession.date,
                discipline: extraSession.discipline,
                duration: extraSession.duration,
                intensityLevel: extraSession.intensityLevel,
                calories: extraSession.calories,
                notes: extraSession.notes,
            },
        };

        return this.api.updateDayLog(payload).pipe(
            tap((res) => {
                if (res) {
                    this.state.setDayLog(res);
                }
            }),
            map(() => this.state.getDayLogValue()),
        );
    }

    removeExtraSession(extraSessionId: string): Observable<DayLogVM | null> {
        return this.api.removeExtraSessionFromDayLog(extraSessionId).pipe(
            tap((res) => {
                if (res) {
                    this.state.setDayLog(res);
                }
            }),
            map(() => this.state.getDayLogValue()),
        );
    }

    updateWorkoutSession(workout: WorkoutSessionVM): Observable<WorkoutSessionVM | null> {
        return this.api.updateWorkoutSession(workout);
    }

    removeWorkoutSession(workoutSessionId: string): Observable<DayLogVM | null> {
        return this.api.removeWorkoutSessionFromDayLog(workoutSessionId).pipe(
            tap((res) => {
                if (res) {
                    this.state.setDayLog(res);
                }
            }),
            map(() => this.state.getDayLogValue()),
        );
    }

    setRestDay(date: LocalDate, isRest: boolean): Observable<DayLogVM | null> {
        return this.api.updateDayLogStatus(date, isRest).pipe(
            tap((res) => {
                if (res) {
                    this.state.setDayLog(res);
                }
            }),
            map(() => this.state.getDayLogValue()),
        );
    }

    completeDayLog(complete: boolean): Observable<DayLogVM | null> {
        const current = this.state.getDayLogValue();
        if (!current) return of(null);

        this.state.setLoading(true);

        return this.api.updateDayLog({ id: current.id, completed: complete }).pipe(
            tap((res) => {
                if (res) {
                    this.storage.removeDayLogStorage(current.userId);
                    this.state.setDayLog(null);
                }
            }),
            finalize(() => this.state.setLoading(false)),
        );
    }

    createRoutineFromWorkout(
        title: string,
        exerciseIds: string[],
    ): Observable<RoutineDayAPI | null> {
        return this.api.createRoutineByWorkout(title, exerciseIds).pipe(
            tap(() => {
                this.routineService.updateAllRoutines().subscribe();
            }),
        );
    }

    removeDayLog(id: string): Observable<boolean> {
        return this.api.removeDayLog(id).pipe(
            tap((success) => {
                if (success) {
                    const current = this.state.getDayLogValue();
                    if (current?.id === id) {
                        this.storage.removeDayLogStorage(current.userId);
                        this.state.setDayLog(null);
                    }
                }
            }),
        );
    }
}
