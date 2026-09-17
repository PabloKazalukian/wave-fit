import { inject, Injectable, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { LocalDate } from '../../../shared/interfaces/tracking.interface';
import { DayLogVM } from '../../../shared/interfaces/day-log.interface';
import { IndexedDbStorageService } from '../storage/indexed-db.service';

@Injectable({
    providedIn: 'root',
})
export class PlanDayStateService {
    private idb = inject(IndexedDbStorageService);

    private dayLogSubject = new BehaviorSubject<DayLogVM | null>(null);
    readonly dayLog$ = this.dayLogSubject.asObservable();
    readonly dayLog = toSignal(this.dayLog$, { initialValue: null });

    readonly loading = signal(false);
    readonly loadingDayLog = signal(false);
    readonly error = signal<string | null>(null);

    readonly userId = signal<string>('');
    readonly loadingWorkoutCreation = signal<{ date: LocalDate; state: boolean }>({
        date: '',
        state: false,
    });

    readonly loadingStatusWorkout = signal<boolean>(false);

    getDayLog(): DayLogVM | null {
        return this.dayLogSubject.value;
    }

    getDayLogValue(): DayLogVM | null {
        return this.dayLogSubject.value;
    }

    setDayLog(dayLog: DayLogVM | null): void {
        this.dayLogSubject.next(dayLog);
        if (dayLog) {
            this.idb.saveDayLog(dayLog);
        }
    }

    setLoading(isLoading: boolean): void {
        this.loading.set(isLoading);
    }

    setLoadingDayLog(isLoading: boolean): void {
        this.loadingDayLog.set(isLoading);
    }

    setLoadingStatusWorkout(isLoading: boolean): void {
        this.loadingStatusWorkout.set(isLoading);
    }

    setLoadingWorkoutCreation(date: LocalDate, isLoading: boolean): void {
        this.loadingWorkoutCreation.set({ date, state: isLoading });
    }

    setError(error: string | null): void {
        this.error.set(error);
    }

    updateDayLog(updater: (d: DayLogVM) => DayLogVM): void {
        const current = this.dayLogSubject.value;
        if (current) {
            const updated = updater(current);
            this.dayLogSubject.next(updated);
            this.idb.saveDayLog(updated);
        }
    }
}
