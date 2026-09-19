import { signal } from '@angular/core';
import { of } from 'rxjs';

import { WorkoutStore } from '../services/workouts/workout-store.interface';

export const workoutStoreMock: WorkoutStore = {
    selectedDate: signal<string | null>(null),
    workoutSession: signal(null),
    exercises: signal([]),
    outOfDateRange: signal(false),
    loadingWorkoutCreation: signal({ date: '', state: false }),
    loadingStatusWorkout: signal(false),
    loading: signal(false),
    setDate: jasmine.createSpy('setDate'),
    updateExercises: jasmine.createSpy('updateExercises'),
    createWorkout: jasmine.createSpy('createWorkout').and.returnValue(of(null)),
    setRestDay: jasmine.createSpy('setRestDay').and.returnValue(of(null)),
    setRemoveAllExercises: jasmine.createSpy('setRemoveAllExercises'),
    updateWorkoutStatus: jasmine.createSpy('updateWorkoutStatus'),
    updateWorkoutSession: jasmine.createSpy('updateWorkoutSession'),
    removeWorkoutSession: jasmine.createSpy('removeWorkoutSession').and.returnValue(of(true)),
    createWorkoutWithRoutine: jasmine
        .createSpy('createWorkoutWithRoutine')
        .and.returnValue(of(null)),
    createRoutineFromWorkout: jasmine
        .createSpy('createRoutineFromWorkout')
        .and.returnValue(of(null)),
};
