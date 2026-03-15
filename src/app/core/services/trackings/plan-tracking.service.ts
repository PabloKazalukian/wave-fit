import { inject, Injectable } from '@angular/core';
import { PlanTrackingDomainService } from './plan-tracking-domain.service';
import { PlanTrackingStateService } from './plan-tracking-state.service';
import { filter, map, Observable } from 'rxjs';
import {
    ExercisePerformanceVM,
    TrackingVM,
    TrackingVMS,
    WorkoutSessionVM,
} from '../../../shared/interfaces/tracking.interface';
import { DateService } from '../date.service';

@Injectable({
    providedIn: 'root',
})
export class PlanTrackingService {
    private domain = inject(PlanTrackingDomainService);
    private state = inject(PlanTrackingStateService);
    private dateService = inject(DateService);

    readonly tracking$ = this.state.tracking$;
    readonly tracking = this.state.tracking;
    readonly loading = this.state.loading;
    readonly loadingTracking = this.state.loadingTracking;
    readonly loadingWorkoutCreation = this.state.loadingWorkoutCreation;
    readonly trackingPlanVM$ = this.state.tracking$; // Alias for backward compatibility

    createTracking(planId?: string): Observable<TrackingVM | null | undefined> {
        return this.domain.createTracking(planId);
    }

    createWorkout(dateWorkout: Date): Observable<WorkoutSessionVM | null | undefined> {
        return this.domain.createWorkout(dateWorkout);
    }

    toggleExercise(date: Date, exercise: ExercisePerformanceVM): void {
        this.domain.toggleExercise(date, exercise);
    }

    removeExercise(date: Date, exerciseId: string): void {
        this.domain.removeExercise(date, exerciseId);
    }

    setWorkouts(day: Date, workout: WorkoutSessionVM): void {
        this.domain.setWorkouts(day, workout);
    }

    setExercises(date: Date, exercises: ExercisePerformanceVM[]): void {
        this.domain.setExercises(date, exercises);
    }

    setRestDay(day: Date, workout: WorkoutSessionVM): void {
        this.domain.setRestDay(day, workout);
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
}

