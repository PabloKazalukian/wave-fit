import { DestroyRef, effect, inject, Injectable } from '@angular/core';
import { PlanTrackingDomainService } from './plan-tracking.domain';
import { PlanTrackingStateService } from './plan-tracking.state';
import { debounceTime, filter, finalize, map, Observable, Subject, switchMap, tap } from 'rxjs';
import {
    ExercisePerformanceVM,
    LocalDate,
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
import { RoutineDayAPI } from '../../../shared/interfaces/api/routines-api.interface';

@Injectable({
    providedIn: 'root',
})
export class PlanTrackingService {
    destroyRef = inject(DestroyRef);

    private domain = inject(PlanTrackingDomainService);
    private state = inject(PlanTrackingStateService);
    private dateService = inject(DateService);
    private storage = inject(PlanTrackingStorage);

    readonly tracking = this.state.tracking;
    readonly loading = this.state.loading;
    readonly loadingTracking = this.state.loadingTracking;
    readonly loadingWorkoutCreation = this.state.loadingWorkoutCreation;
    readonly loadingStatusWorkout = this.state.loadingStatusWorkout;
    readonly trackingPlanVM$ = this.state.tracking$; // Alias for backward compatibility
    private authService = inject(AuthService);

    user$ = toSignal(this.authService.user$);
    private exercisesUpdate$ = new Subject<{ date: LocalDate; exercises: ExercisePerformanceVM[] }>();

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

        this.exercisesUpdate$
            .pipe(debounceTime(4000), takeUntilDestroyed(this.destroyRef))
            .subscribe(({ date, exercises }) => {
                this.domain.updateExercises(date, exercises).subscribe();
            });
    }

    private initTracking(userId: string) {
        if (this.state.userId() === userId && this.state.getTrackingValue()) {
            return;
        }

        this.state.userId.set(userId);
        this.state.setLoadingTracking(true);

        const stored = this.storage.getTrackingStorage(this.state.userId());

        this.domain
            .initTracking()
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                finalize(() => this.state.setLoadingTracking(false)),
            )
            .subscribe((activeTracking) => {
                if (stored) {
                    if (activeTracking && activeTracking.id === stored.id) {
                        this.state.setTracking(stored);
                    } else if (activeTracking && activeTracking.id !== stored.id) {
                        this.storage.removeTrackingStorage(this.state.userId());
                        this._persist(activeTracking);
                    } else {
                        this.storage.removeTrackingStorage(this.state.userId());
                        this.state.setTracking(null);
                    }
                } else {
                    if (activeTracking) {
                        this._persist(activeTracking);
                    } else {
                        this.state.setTracking(null);
                    }
                }
            });
    }

    private _updateWorkout(
        localDate: LocalDate,
        updater: (w: WorkoutSessionVM) => WorkoutSessionVM,
    ) {
        this.state.updateWorkout(localDate, updater);
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

    createWorkout(dateWorkout: LocalDate): Observable<WorkoutSessionVM | null | undefined> {
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
        date: LocalDate,
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
                return this.getWorkout(date);
            }),
        );
    }

    findAll(limit = 5, offset = 0): Observable<TrackingVM[] | null> {
        return this.domain.findAllTrackingByUser(limit, offset);
    }

    findById(id: string): Observable<TrackingVM | null> {
        return this.domain.findById(id);
    }

    // removeExercise(date: LocalDate, exerciseId: string): void {
    //     this._updateWorkout(date, (workout) => ({
    //         ...workout,
    //         exercises: (workout.exercises || []).filter((e) => e.exerciseId !== exerciseId),
    //     }));
    // }

    setExercises(date: LocalDate, exercises: ExercisePerformanceVM[]) {
        this._updateWorkout(date, (workout) => ({ ...workout, exercises }));
        this.exercisesUpdate$.next({ date, exercises });
    }

    setRestDay(
        day: LocalDate,
        workout: WorkoutSessionVM,
        desiredStatus: StatusWorkoutSessionEnum,
    ): Observable<TrackingVM | null | undefined> {
        const isRest = desiredStatus === StatusWorkoutSessionEnum.REST;

        this.state.setLoadingStatusWorkout(true);
        return this.domain.setRestDay(day, isRest).pipe(
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
            finalize(() => this.state.setLoadingStatusWorkout(false)),
        );
    }

    updateExtraSession(
        date: LocalDate,
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
        date: LocalDate,
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

    updateWorkoutStatus(date: LocalDate, status: StatusWorkoutSession) {
        const tracking = this.state.getTrackingValue();
        if (!tracking) return;

        // Update local cache
        this._updateWorkout(date, (workout) => ({ ...workout, status }));
    }

    updateWorkoutSession(date: LocalDate, workout: WorkoutSessionVM): void {
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

    getExercises(workoutDate: LocalDate): Observable<ExercisePerformanceVM[]> {
        return this.state.tracking$.pipe(
            filter((tracking) => !!tracking),
            map(
                (tracking) =>
                    tracking?.workouts?.filter((w) =>
                        this.dateService.isSameLocalDate(w.date, workoutDate),
                    ) || [],
            ),
            map((workouts) => workouts[0]?.exercises || []),
        );
    }

    getWorkout(date: LocalDate): Observable<WorkoutSessionVM | undefined> {
        return this.state.tracking$.pipe(
            filter((tracking) => !!tracking),
            map((tracking) => tracking?.workouts || []),
            map((workouts) => workouts.find((w) => this.dateService.isSameLocalDate(w.date, date))),
        );
    }

    getExercise(
        date: LocalDate,
        exerciseId: string,
    ): Observable<ExercisePerformanceVM | undefined> {
        return this.state.tracking$.pipe(
            filter((tracking) => !!tracking),
            map((tracking) => tracking?.workouts || []),
            map((workouts) => workouts.find((w) => this.dateService.isSameLocalDate(w.date, date))),
            map((workout) => workout?.exercises.find((e) => e.exerciseId === exerciseId)),
        );
    }

    setRemoveAllExercises(date: LocalDate): void {
        this._updateWorkout(date, (workout) => ({
            ...workout,
            exercises: [],
        }));
        this.exercisesUpdate$.next({ date, exercises: [] });
    }

    removeWorkoutSession(date: LocalDate, id: string): Observable<boolean> {
        this.state.setLoadingStatusWorkout(true);
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
            finalize(() => this.state.setLoadingStatusWorkout(false)),
        );
    }

    createRoutineFromWorkout(
        title: string,
        exerciseIds: string[],
    ): Observable<RoutineDayAPI | null> {
        return this.domain.createRoutineFromWorkout(title, exerciseIds);
    }

    removeTracking(id: string): Observable<boolean> {
        return this.domain.removeTracking(id);
    }
}
