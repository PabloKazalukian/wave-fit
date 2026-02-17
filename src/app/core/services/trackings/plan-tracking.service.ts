import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { PlanTrankingApi } from './plan-tracking/api/plan-tranking-api.service';
import { PlanTrackingStorage } from './plan-tracking/storage/plan-tracking-storage.service';
import { BehaviorSubject, filter, map, Observable, of, tap } from 'rxjs';
import {
    ExercisePerformanceVM,
    StatusWorkoutSessionEnum,
    TrackingVM,
    WorkoutSessionVM,
} from '../../../shared/interfaces/tracking.interface';
import { DateService } from '../date.service';
import { TrackingAPI, TrackingCreate } from '../../../shared/interfaces/api/tracking-api.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable({
    providedIn: 'root',
})
export class PlanTrackingService {
    destroyRef = inject(DestroyRef);

    private trackingSubject = new BehaviorSubject<TrackingVM | null>(null);
    trackingPlanVM$ = this.trackingSubject.asObservable();

    private api = inject(PlanTrankingApi);
    private storage = inject(PlanTrackingStorage);
    private dateService = inject(DateService);

    userId = signal<string>('');
    loading = signal(false);

    initTracking(userId: string) {
        if (this.userId() !== '') {
            return;
        }

        this.userId.set(userId);
        const stored = this.storage.getTrackingStorage(this.userId());

        if (stored) {
            this.trackingSubject.next(stored);
        } else {
            this.api
                .getTrackingByUser()
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe((res) => {
                    if (!res) {
                        return;
                    }

                    this._persist(res);
                });
        }
    }

    createTracking(): Observable<TrackingVM | null | undefined> {
        const { start, end } = this.dateService.todayPlusDays(7);

        const payload: TrackingCreate = {
            startDate: start,
            endDate: end,
            completed: false,
            // planId: this.userId(),
        };

        return this.api.createTracking(payload).pipe(
            tap((res) => {
                if (res !== undefined && res !== null) {
                    this.storage.setTrackingStorage(res, this.userId());
                    this.trackingSubject.next(res);
                }
            }),
            map((res) => this.trackingSubject.value),
        );
    }

    createWorkout(dateWorkout: Date): Observable<WorkoutSessionVM | null | undefined> {
        this.loading.set(true);
        const workout = this.trackingSubject.value?.workouts?.filter((w) =>
            this.dateService.isEqualDate(w.date, dateWorkout),
        )[0];
        // if (!workout) return of(null);
        const id = this.trackingSubject.value;
        console.log(id);
        if (id!) {
            return this.api.createWorkoutSession(workout!, id.id!).pipe(
                takeUntilDestroyed(this.destroyRef),
                tap((res) => {
                    // console.log(res?.date);
                    const workout = { ...res!, status: StatusWorkoutSessionEnum.COMPLETE };
                    this._updateWorkout(res?.date!, () => workout);
                    // this._persist(this.trackingSubject.value!);
                }),
                tap(() => this.loading.set(false)),
            );
        }
        return of(null);
    }

    // Agregar al PlanTrackingService:

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

    setWorkouts(day: Date, workout: WorkoutSessionVM) {
        this._updateWorkout(day, () => workout);
    }

    setExercises(date: Date, exercises: ExercisePerformanceVM[]) {
        this._updateWorkout(date, (workout) => ({ ...workout, exercises }));
    }

    get getWorkouts(): Observable<WorkoutSessionVM[]> {
        return this.trackingPlanVM$.pipe(
            filter((tracking) => !!tracking),
            map((tracking) => tracking.workouts || []),
        );
    }

    getExercises(workoutDate: Date): Observable<ExercisePerformanceVM[]> {
        return this.trackingPlanVM$.pipe(
            filter((tracking) => !!tracking),
            map(
                (tracking) =>
                    tracking.workouts?.filter((w) =>
                        this.dateService.isEqualDate(w.date, workoutDate),
                    ) || [],
            ),
            map((workouts) => workouts[0]?.exercises || []),
        );
    }

    getWorkout(date: Date): Observable<WorkoutSessionVM | undefined> {
        return this.trackingPlanVM$.pipe(
            filter((tracking) => !!tracking),
            map((tracking) => tracking.workouts || []),
            map((workouts) => workouts.find((w) => this.dateService.isEqualDate(w.date, date))),
        );
    }

    getExercise(date: Date, exerciseId: string): Observable<ExercisePerformanceVM | undefined> {
        return this.trackingPlanVM$.pipe(
            filter((tracking) => !!tracking),
            map((tracking) => tracking.workouts || []),
            map((workouts) => workouts.find((w) => this.dateService.isEqualDate(w.date, date))),
            map((workout) => workout?.exercises.find((e) => e.exerciseId === exerciseId)),
        );
    }

    private _updateWorkout(date: Date, updater: (w: WorkoutSessionVM) => WorkoutSessionVM) {
        const current = this.trackingSubject.value;
        if (!current) return;

        const updated = {
            ...current,
            workouts: current.workouts?.map((w) =>
                this.dateService.isEqualDate(w.date, date) ? updater(w) : w,
            ),
        };

        this._persist(updated);
    }

    private _persist(tracking: TrackingVM) {
        this.trackingSubject.next(tracking);
        this.storage.setTrackingStorage(tracking, this.userId());
    }
}
