import { computed, DestroyRef, effect, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, catchError, finalize, Observable, of, tap } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { ActiveTrackingApi } from './active-tracking.api';
import {
    ActiveDayVM,
    ActiveTrackingVM,
    ActiveWeekVM,
} from '../../../shared/interfaces/day-log.interface';

@Injectable({
    providedIn: 'root',
})
export class ActiveTrackingService {
    private destroyRef = inject(DestroyRef);
    private api = inject(ActiveTrackingApi);
    private authService = inject(AuthService);

    userId$ = toSignal(this.authService.user$);

    private activeTrackingSubject = new BehaviorSubject<ActiveTrackingVM | null>(null);
    readonly activeTracking$ = this.activeTrackingSubject.asObservable();
    readonly activeTracking = toSignal(this.activeTracking$, { initialValue: null });

    readonly loading = signal(false);
    readonly ready = signal(false);
    readonly error = signal<string | null>(null);

    private currentUserId = '';

    constructor() {
        effect(() => {
            const userId = this.userId$();
            if (userId) {
                this.init(userId);
            } else {
                this.reset();
            }
        });
    }

    hasActive = computed(() => this.activeTracking()?.hasActive ?? false);
    isWeekLogActive = computed(
        () => this.hasActive() && this.activeTracking()?.type === 'WEEK_LOG',
    );
    isDayLogActive = computed(() => this.hasActive() && this.activeTracking()?.type === 'DAY_LOG');
    readonly mode = computed<'week' | 'day'>(() => (this.isDayLogActive() ? 'day' : 'week'));

    getActiveTracking(): ActiveTrackingVM | null {
        return this.activeTrackingSubject.value;
    }

    setActiveTracking(active: ActiveTrackingVM | null): void {
        this.activeTrackingSubject.next(active);
    }

    fetchActiveTracking(): Observable<ActiveTrackingVM> {
        this.loading.set(true);
        return this.api.getActiveTracking().pipe(
            takeUntilDestroyed(this.destroyRef),
            tap((active) => {
                this.setActiveTracking(active);
                this.ready.set(true);
            }),
            catchError((err) => {
                console.error('Error fetching active tracking:', err);
                this.error.set(err.message || 'Error fetching active tracking');
                this.setActiveTracking(this.empty());
                this.ready.set(true);
                return of(this.empty());
            }),
            finalize(() => this.loading.set(false)),
        );
    }

    private init(userId: string) {
        if (this.currentUserId === userId && this.ready()) {
            return;
        }

        this.currentUserId = userId;
        this.ready.set(false);
        this.fetchActiveTracking().subscribe();
    }

    /**
     * Recarga el estado activo desde la API. Se usa tras mutaciones (create day/week,
     * complete, remove) cuando el estado local debe confirmarse contra el servidor.
     */
    refresh(): void {
        if (!this.currentUserId) {
            return;
        }
        this.ready.set(false);
        this.fetchActiveTracking().subscribe();
    }

    /** Marca la semana como tracking activo sin consultar la API (tras createTracking). */
    markWeekActive(week: ActiveWeekVM): void {
        this.setActiveTracking({ hasActive: true, type: 'WEEK_LOG', week, day: null });
        this.error.set(null);
        this.ready.set(true);
    }

    /** Marca el día como tracking activo sin consultar la API (tras createDayLog). */
    markDayActive(day: ActiveDayVM): void {
        this.setActiveTracking({ hasActive: true, type: 'DAY_LOG', week: null, day });
        this.error.set(null);
        this.ready.set(true);
    }

    /** Fuerza estado "sin tracking activo" (tras complete/remove day o week). */
    clear(): void {
        this.setActiveTracking(this.empty());
        this.error.set(null);
        this.ready.set(true);
    }

    private reset() {
        this.currentUserId = '';
        this.loading.set(false);
        this.ready.set(false);
        this.error.set(null);
        this.activeTrackingSubject.next(null);
    }

    private empty(): ActiveTrackingVM {
        return { hasActive: false, type: 'WEEK_LOG', week: null, day: null };
    }
}
