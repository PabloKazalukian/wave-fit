import { DestroyRef, effect, inject, Injectable } from '@angular/core';
import { PlanTrackingDomainService } from './plan-tracking.domain';
import { PlanTrackingStateService } from './plan-tracking.state';
import { filter, finalize, map, Observable, of, switchMap, tap } from 'rxjs';
import {
    ExercisePerformanceVM,
    StatusWorkoutSession,
    StatusWorkoutSessionEnum,
    TrackingVM,
    TrackingVMS,
    WorkoutSessionVM,
} from '../../../shared/interfaces/tracking.interface';
import { DateService } from '../date.service';
import { CreateExtraSessionForm } from '../../../shared/interfaces/extra-session.interface';
import { PlanTrackingStorage } from './plan-tracking/storage/plan-tracking.storage';
import { AuthService } from '../auth/auth.service';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { wrapperDayStatusApiToStatusWorkoutSession } from '../../../shared/wrappers/tracking.wrapper';
import { DayStatusAPI } from '../../../shared/interfaces/api/tracking-api.interface';

@Injectable({
    providedIn: 'root',
})
export class PlanTrackingService {
    destroyRef = inject(DestroyRef);

    private domain = inject(PlanTrackingDomainService);
    private state = inject(PlanTrackingStateService);
    private dateService = inject(DateService);
    private storage = inject(PlanTrackingStorage);

    readonly tracking$ = this.state.tracking$;
    readonly tracking = this.state.tracking;
    readonly loading = this.state.loading;
    readonly loadingTracking = this.state.loadingTracking;
    readonly loadingWorkoutCreation = this.state.loadingWorkoutCreation;
    readonly trackingPlanVM$ = this.state.tracking$; // Alias for backward compatibility
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
            this.domain
                .initTracking(userId)
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

    private _updateWorkout(date: Date, updater: (w: WorkoutSessionVM) => WorkoutSessionVM) {
        console.log(date, 'update workout', this.state.getTrackingValue());
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

    createTracking(planId?: string): Observable<TrackingVM | null | undefined> {
        return this.domain.createTracking(planId);
    }

    createWorkout(dateWorkout: Date): Observable<WorkoutSessionVM | null | undefined> {
        return this.domain.createWorkout(dateWorkout).pipe(
            map((res) => {
                if (!res) return null;

                const { index, workoutDraft } = res;

                // 👇 Ahora el Service orquesta state y storage
                this._updateWorkout(workoutDraft.date, (w) => ({
                    ...w,
                    id: workoutDraft.id,
                    exercises: workoutDraft.exercises,
                    status: StatusWorkoutSessionEnum.COMPLETE,
                }));

                const tracking = this.state.getTrackingValue();
                return tracking?.workouts?.[index] ?? null;
            }),
        );
    }
    createWorkoutWithRoutine(
        routineDayId: string,
        date: string,
    ): Observable<WorkoutSessionVM | null | undefined> {
        return this.domain.createWorkoutWithRoutine(routineDayId, date).pipe(
            takeUntilDestroyed(this.destroyRef),
            tap((res) => {
                if (res) {
                    this._updateWorkout(res.date, (old) => ({
                        ...old,
                        id: res.workoutSessionId ?? old.id,
                        exercises: res.exercises,
                        status: res.isRest
                            ? StatusWorkoutSessionEnum.REST
                            : wrapperDayStatusApiToStatusWorkoutSession(
                                  res.status as unknown as DayStatusAPI,
                              ),
                    }));
                }
            }),
            switchMap(() => {
                return this.getWorkout(new Date(date));
            }),
        );
    }

    findAll(): Observable<TrackingVM[] | null> {
        return this.domain.findAllTrackingByUser();
    }

    findById(id: string): Observable<TrackingVM | null> {
        return this.domain.findById(id);
    }

    removeExercise(date: Date, exerciseId: string): void {
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

    setRestDay(
        day: Date,
        workout: WorkoutSessionVM,
        desiredStatus: StatusWorkoutSessionEnum,
    ): Observable<TrackingVM | null | undefined> {
        const isRest = desiredStatus === StatusWorkoutSessionEnum.REST;

        const formattedDate = this.dateService.formatDate(day);
        return this.domain.setRestDay(formattedDate, isRest).pipe(
            tap((res) => {
                if (res) {
                    this._updateWorkout(day, (old) => ({
                        ...old,
                        status: isRest
                            ? StatusWorkoutSessionEnum.REST
                            : StatusWorkoutSessionEnum.NOT_STARTED,
                        exercises: isRest ? [] : old.exercises,
                    }));
                }
            }),
            map(() => this.state.getTrackingValue()),
        );
    }

    updateExtraSession(
        date: Date,
        extraSession: CreateExtraSessionForm,
    ): Observable<TrackingVM | null | undefined> {
        return this.domain.updateExtraSession(date, extraSession).pipe(
            tap((res) => {
                if (res) {
                    this._updateWorkout(date, (old) => ({
                        ...old,
                        id: res.workoutSessionId ?? old.id,
                        extras: res.extraSessionIds,
                    }));
                }
            }),
            map(() => this.state.getTrackingValue()),
        );
    }

    removeExtraSession(
        date: Date,
        extraSessionId: string,
    ): Observable<TrackingVM | null | undefined> {
        return this.domain.removeExtraSession(date, extraSessionId).pipe(
            tap((res) => {
                if (res) {
                    this._updateWorkout(date, (old) => ({
                        ...old,
                        extras: res.extraSessionIds,
                    }));
                }
            }),
            map(() => this.state.getTrackingValue()),
        );
    }

    updateWorkoutStatus(date: Date, status: StatusWorkoutSession) {
        const tracking = this.state.getTrackingValue();
        if (!tracking) return;

        // Update local cache
        this._updateWorkout(date, (workout) => ({ ...workout, status }));
    }

    updateWorkoutSession(date: Date, workout: WorkoutSessionVM): void {
        // Call API
        this.domain
            .updateWorkoutSession(date, workout)
            ?.pipe(
                takeUntilDestroyed(this.destroyRef),
                finalize(() => {
                    // Update local cache
                    this._updateWorkout(date, () => workout);
                }),
            )
            .subscribe();
    }

    completeTracking(complete: boolean): Observable<TrackingVMS | null> {
        return this.domain.completeTracking(complete);
    }

    get getWorkouts(): Observable<WorkoutSessionVM[]> {
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

    setRemoveAllExercises(date: Date, workout: WorkoutSessionVM): void {
        this._updateWorkout(date, (workout) => ({
            ...workout,
            exercises: [],
        }));
    }

    removeWorkoutSession(date: Date, id: string): Observable<boolean> {
        return this.domain.removeWorkoutSession(date, id).pipe(
            map((res) => {
                if (!res) return false;
                this._updateWorkout(date, (old) => ({
                    ...old,
                    id: undefined,
                    exercises: [],
                    status: StatusWorkoutSessionEnum.NOT_STARTED,
                }));
                return true;
            }),
        );
    }

    createRoutineFromWorkout(title: string, exerciseIds: string[]): Observable<any> {
        return this.domain.createRoutineFromWorkout(title, exerciseIds);
    }
}
