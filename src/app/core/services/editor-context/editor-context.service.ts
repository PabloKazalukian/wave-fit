import { Injectable, inject } from '@angular/core';
import { EditorContext } from './editor-context.interface';
import { signal } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { ActiveTrackingService } from '../trackings/active-tracking.service';
import { PlanDayService } from '../day-logs/plan-day.service';
import { PlanTrackingService } from '../trackings/plan-tracking.service';
import { Observable, of } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class EditorContextService {
    private context = {} as EditorContext;
    private loading = signal(false);

    private activeTrackingSvc = inject(ActiveTrackingService);
    private planDayService = inject(PlanDayService);
    private planTrackingService = inject(PlanTrackingService);

    /** Establecer el contexto de edición (llamado desde la ruta o desde UI). */
    setContext(context: EditorContext): void {
        this.context = { ...this.context, ...context };
    }

    /** Obtener el contexto actual. */
    getContext(): EditorContext {
        return this.context;
    }

    /** Determina si el contexto es de día-log diferido. */
    isDeferredDayLog(): boolean {
        return this.context.containerType === 'DEFERRED_DAY_LOG';
    }

    /** Determina si el contexto es de día dentro de week-log. */
    isWeekLogDay(): boolean {
        return this.context.containerType === 'WEEK_LOG_DAY';
    }

    /** Cargar la sesión de workout según el contexto activo. */
    loadWorkoutSession(): Observable<any> {
        if (this.isDeferredDayLog()) {
            return this.loadDeferredDayLogSession();
        }
        if (this.isWeekLogDay()) {
            return this.loadWeekLogDaySession();
        }
        return of([]);
    }

    /** Cargar workout session desde un deferred day-log por ID. */
    private loadDeferredDayLogSession(): Observable<any> {
        const containerId = this.context.containerId;
        if (!containerId) {
            return of([]);
        }
        return this.planDayService.findById(containerId);
    }

    /** Cargar workout session desde un week-log day por weekLogId y dayOrder. */
    private loadWeekLogDaySession(): Observable<any> {
        const weekLogId = this.context.weekLogId;
        const dayOrder = this.context.dayOrder;

        if (!weekLogId || dayOrder === undefined) {
            return of([]);
        }

        return this.planTrackingService.findById(weekLogId);
    }

    /** Complete to deferred day-log using the verified day-log completion operation.
     *  Flips completed=true, active=false and clears state/storage.
     */
    completeDeferredDayLog(): void {
        const current = this.planDayService.getCurrentDayLogValue();
        if (!current) {
            console.error('No day-log found to complete');
            return;
        }

        this.loading.set(true);

        this.planDayService
            .completeDayLog(true)
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (res) => {
                    if (res) {
                        // State cleanup already handled by domain service:
                        // storage removed, dayLog set to null, activeTracking cleared
                        console.log('Deferred day-log completed successfully');
                        // TODO: Navegar a /my-day/success
                        // this.router.navigate(['/my-day/success']);
                    }
                },
                error: (err) => {
                    console.error('Error completing deferred day-log:', err);
                },
            });
    }
}
