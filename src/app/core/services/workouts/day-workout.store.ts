import { computed, inject, Injectable, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, Observable } from 'rxjs';
import {
    ExercisePerformanceVM,
    LocalDate,
    StatusWorkoutSession,
    StatusWorkoutSessionEnum,
    WorkoutSessionVM,
} from '../../../shared/interfaces/tracking.interface';
import { DayLogVM } from '../../../shared/interfaces/day-log.interface';
import { PlanDayService } from '../day-logs/plan-day.service';
import { WorkoutStore } from './workout-store.interface';
import { RoutineDayAPI } from '../../../shared/interfaces/api/routines-api.interface';

/**
 * Implementacion de `WorkoutStore` para el modo day-log.
 * Adapta `PlanDayService` (modelo flat: un unico workout global) al contrato
 * que los widgets day-level esperan, de modo que se reutilizan sin cambios.
 */
@Injectable({
    providedIn: 'root',
})
export class DayWorkoutStore implements WorkoutStore {
    private planDaySvc = inject(PlanDayService);

    private dayLog = toSignal(this.planDaySvc.dayLog$, { initialValue: null as DayLogVM | null });

    readonly loadingWorkoutCreation = this.planDaySvc.loadingWorkoutCreation;
    readonly loadingStatusWorkout = this.planDaySvc.loadingStatusWorkout;
    readonly loading = this.planDaySvc.loading;

    readonly selectedDate = computed<LocalDate | null>(() => this.dayLog()?.date ?? null);
    readonly outOfDateRange = signal(false);

    readonly workoutSession = computed<WorkoutSessionVM | null>(() =>
        this.toWorkout(this.dayLog()),
    );

    readonly exercises = computed<ExercisePerformanceVM[]>(() => this.dayLog()?.exercises ?? []);

    setDate(date: LocalDate): void {
        this.outOfDateRange.set(false);
        void date;
    }

    updateExercises(exercises: ExercisePerformanceVM[]): void {
        this.planDaySvc.setExercises(exercises);
    }

    createWorkout(date: LocalDate): Observable<unknown> {
        return this.planDaySvc
            .setRestDay(date, false)
            .pipe(map((dayLog) => this.toWorkout(dayLog)));
    }

    setRestDay(
        date: LocalDate,
        _workout: WorkoutSessionVM,
        status: StatusWorkoutSession,
    ): Observable<unknown> {
        const isRest = status === StatusWorkoutSessionEnum.REST;
        return this.planDaySvc
            .setRestDay(date, isRest)
            .pipe(map((dayLog) => this.toWorkout(dayLog)));
    }

    setRemoveAllExercises(date: LocalDate): void {
        this.planDaySvc.setRemoveAllExercises();
        void date;
    }

    updateWorkoutStatus(_date: LocalDate, status: StatusWorkoutSession): void {
        const dayStatus: DayLogVM['status'] =
            status === StatusWorkoutSessionEnum.COMPLETE
                ? 'complete'
                : status === StatusWorkoutSessionEnum.REST
                  ? 'skipped'
                  : 'pending';
        this.planDaySvc.updateWorkoutStatus(dayStatus as StatusWorkoutSession);
    }

    updateWorkoutSession(_date: LocalDate, workout: WorkoutSessionVM): void {
        this.planDaySvc.updateWorkoutSession(workout);
    }

    removeWorkoutSession(_date: LocalDate, id: string): Observable<boolean> {
        return this.planDaySvc.removeWorkoutSession(id).pipe(map((res) => !!res));
    }

    createWorkoutWithRoutine(routineDayId: string, date: LocalDate): Observable<unknown> {
        return this.planDaySvc
            .createWorkoutWithRoutine(routineDayId, date)
            .pipe(map((dayLog) => this.toWorkout(dayLog)));
    }

    createRoutineFromWorkout(
        title: string,
        exerciseIds: string[],
    ): Observable<RoutineDayAPI | null> {
        return this.planDaySvc.createRoutineFromWorkout(title, exerciseIds);
    }

    private toWorkout(dayLog: DayLogVM | null): WorkoutSessionVM | null {
        if (!dayLog) return null;
        const status =
            dayLog.status === 'skipped'
                ? StatusWorkoutSessionEnum.REST
                : dayLog.status === 'complete'
                  ? StatusWorkoutSessionEnum.COMPLETE
                  : StatusWorkoutSessionEnum.NOT_STARTED;
        return {
            id: dayLog.workoutSessionId,
            date: dayLog.date,
            exercises: dayLog.exercises ?? [],
            extras: dayLog.extraSessionIds,
            status,
        };
    }
}
