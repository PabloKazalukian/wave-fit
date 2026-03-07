import { inject, Injectable, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { TrackingVM, WorkoutSessionVM } from '../../../shared/interfaces/tracking.interface';
import { DateService } from '../date.service';

@Injectable({
    providedIn: 'root',
})
export class PlanTrackingStateService {
    private dateService = inject(DateService);

    private trackingSubject = new BehaviorSubject<TrackingVM | null>(null);
    readonly tracking$ = this.trackingSubject.asObservable();
    readonly tracking = toSignal(this.tracking$, { initialValue: null });

    readonly loading = signal(false);
    readonly loadingTracking = signal(false);
    readonly error = signal<string | null>(null);

    readonly userId = signal<string>('');
    readonly loadingWorkoutCreation = signal<{ wokout: Date; state: boolean }>({
        wokout: new Date(),
        state: false,
    });

    getTracking(): TrackingVM | null {
        return this.trackingSubject.value;
    }

    getTrackingValue(): TrackingVM | null {
        return this.trackingSubject.value;
    }

    setTracking(tracking: TrackingVM | null): void {
        this.trackingSubject.next(tracking);
    }

    setLoading(isLoading: boolean): void {
        this.loading.set(isLoading);
    }

    setLoadingTracking(isLoading: boolean): void {
        this.loadingTracking.set(isLoading);
    }

    setError(error: string | null): void {
        this.error.set(error);
    }

    updateTracking(updater: (t: TrackingVM) => TrackingVM): void {
        const current = this.trackingSubject.value;
        if (current) {
            this.trackingSubject.next(updater(current));
        }
    }

    updateWorkout(date: Date, updater: (w: WorkoutSessionVM) => WorkoutSessionVM): void {
        const current = this.trackingSubject.value;
        if (!current) return;

        const updated = {
            ...current,
            workouts: current.workouts?.map((w) =>
                this.dateService.isEqualDate(w.date, date) ? updater(w) : w,
            ),
        };

        this.trackingSubject.next(updated);
    }
}
