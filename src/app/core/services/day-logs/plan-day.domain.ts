import { inject, Injectable } from '@angular/core';
import { finalize, firstValueFrom, from, map, Observable, of, tap } from 'rxjs';
import {
    ExercisePerformanceVM,
    LocalDate,
    StatusWorkoutSessionEnum,
    WorkoutSessionVM,
} from '../../../shared/interfaces/tracking.interface';
import { DayLogSummaryVM, DayLogVM } from '../../../shared/interfaces/day-log.interface';
import { DateService } from '../date.service';
import { NetworkStatusService } from '../network/network-status.service';
import { SyncQueueService } from '../sync/sync-queue.service';
import { RoutinesService } from '../routines/routines.service';
import { RoutineDayAPI } from '../../../shared/interfaces/api/routines-api.interface';
import { PlanDayApi } from './plan-day/api/plan-day.api';
import { ActiveTrackingApi } from '../trackings/active-tracking.api';
import { PlanDayStateService } from './plan-day.state';
import { PlanDayStorage } from './plan-day/storage/plan-day.storage';
import { CreateDayLogInput } from '../../../shared/interfaces/api/day-log-api.interface';

@Injectable({
    providedIn: 'root',
})
export class PlanDayDomainService {
    private api = inject(PlanDayApi);
    private activeTrackingApi = inject(ActiveTrackingApi);
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
     * Fuente de verdad: consulta activeTracking. Si type === 'DAY_LOG' carga el day-log activo.
     */
    initActiveLog(): Observable<{ hasActive: boolean; type: 'WEEK_LOG' | 'DAY_LOG' }> {
        return this.activeTrackingApi.getActiveTracking().pipe(
            tap((active) => {
                if (active.hasActive && active.type === 'DAY_LOG') {
                    this.state.setLoadingDayLog(true);
                    this.api
                        .getActiveDayLog()
                        .pipe(
                            finalize(() => this.state.setLoadingDayLog(false)),
                        )
                        .subscribe((dayLog) => {
                            if (dayLog) {
                                this.state.setDayLog(dayLog);
                                this.storage.setDayLogStorage(dayLog, dayLog.userId);
                            } else {
                                this.state.setDayLog(null);
                            }
                        });
                } else if (!active.hasActive) {
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

    createDayLog(planId?: string, date?: LocalDate, routineDayId?: string): Observable<DayLogVM | null> {
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

    createWorkoutWithRoutine(
        routineDayId: string,
        date: LocalDate,
    ): Observable<DayLogVM | null> {
        const dayLog = this.state.getDayLogValue();
        if (!dayLog) return of(null);

        return this.api.assignRoutineToDayLog(routineDayId, date).pipe(
            tap((res) => {
                if (res) {
                    this.state.setDayLog(res);
                }
            }),
            map(() => this.state.getDayLogValue()),
        );
    }

    updateExercises(exercises: ExercisePerformanceVM[]): Observable<DayLogVM | null> {
        const dayLog = this.state.getDayLogValue();
        if (!dayLog || !dayLog.workoutSessionId) return of(null);

        const workout: WorkoutSessionVM = {
            id: dayLog.workoutSessionId,
            date: dayLog.date,
            exercises,
            status: StatusWorkoutSessionEnum.COMPLETE,
        };

        if (this.networkSvc.isOnline()) {
            return this.api.updateWorkoutSession(workout).pipe(
                tap((res) => {
                    if (res) {
                        this.state.updateDayLog((d) => ({ ...d, exercises: res.exercises }));
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
    }

    updateExtraSession(): Observable<DayLogVM | null> {
        // El día (day-log) no tiene mutation unificada de sesión extra en el contrato actual.
        return of(null);
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

    createRoutineFromWorkout(title: string, exerciseIds: string[]): Observable<RoutineDayAPI | null> {
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
