import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import { EditorContext } from '../../../../core/services/editor-context/editor-context.interface';
import { EditorContextService } from '../../../../core/services/editor-context/editor-context.service';
import { PlanDayService } from '../../../../core/services/day-logs/plan-day.service';
import { PlanTrackingService } from '../../../../core/services/trackings/plan-tracking.service';
import { ExtraSessionService } from '../../../../core/services/extra-session/extra-session.service';
import { ExtraSessionApi } from '../../../../core/services/extra-session/api/extra-session.api';
import { WorkoutApi } from '../../../../core/services/workouts/api/workout.api';
import { TextLink } from '../../../../shared/components/ui/text-link/text-link';
import { Calendar, LucideAngularModule } from 'lucide-angular';
import { WorkoutSessionEditor } from '../../../../shared/components/widgets/tracking/workout-session-editor/workout-session-editor';
import { Loading } from '../../../../shared/components/ui/loading/loading';
import {
    ExercisePerformanceVM,
    WorkoutSessionVM,
    StatusWorkoutSession,
} from '../../../../shared/interfaces/tracking.interface';
import {
    CreateExtraSessionForm,
    ExtraSession,
    UpdateExtraSessionInput,
} from '../../../../shared/interfaces/extra-session.interface';

@Component({
    selector: 'app-day-deferred',
    standalone: true,
    imports: [TextLink, LucideAngularModule, WorkoutSessionEditor, Loading],
    templateUrl: './day-deferred.html',
    styles: ``,
})
export class DayDeferred implements OnInit, OnDestroy {
    readonly CalendarIcon = Calendar;
    private readonly route = inject(ActivatedRoute);
    private readonly ctxSvc = inject(EditorContextService);
    private readonly planDaySvc = inject(PlanDayService);
    private readonly planTrackingSvc = inject(PlanTrackingService);
    private readonly extraSessionSvc = inject(ExtraSessionService);
    private readonly extraSessionApi = inject(ExtraSessionApi);
    private readonly workoutApi = inject(WorkoutApi);

    // ----- Route-driven context signals -----

    readonly date = signal<string | null>(null);
    readonly containerType = signal<'DEFERRED_DAY_LOG' | 'WEEK_LOG_DAY'>('DEFERRED_DAY_LOG');
    readonly containerId = signal<string | null>(null);
    readonly dayOrder = signal<number | null>(null);
    readonly weekLogId = signal<string | null>(null);

    // ----- Data signals (owned by this page) -----

    readonly workoutSession = signal<WorkoutSessionVM | null>(null);
    readonly exercises = signal<ExercisePerformanceVM[]>([]);
    readonly selectedDate = signal<string>('');
    readonly extraSessions = signal<ExtraSession[]>([]);

    readonly catalog = toSignal(this.extraSessionSvc.catalog$, { initialValue: [] });

    // ----- Loading / error -----

    readonly loading = signal(false);
    readonly error = signal<string | null>(null);

    // ----- EditorContext passed down to WorkoutSessionEditor -----

    readonly editorContext = computed<EditorContext>(() => ({
        containerType: this.containerType(),
        containerId: this.containerId() ?? undefined,
        dayOrder: this.dayOrder() ?? undefined,
        weekLogId: this.weekLogId() ?? undefined,
    }));

    ngOnInit(): void {
        this.extraSessionSvc.loadCatalog();

        const queryParams = this.route.snapshot.queryParamMap;
        const routeParams = this.route.snapshot.paramMap;

        const date = queryParams.get('date');
        const id = queryParams.get('id');
        const weekLogId = routeParams.get('weekLogId');
        const dayOrderStr = routeParams.get('dayOrder');

        this.date.set(date ?? null);

        // Detect context from route params (priority: id > weekLogId+dayOrder > empty DL)
        if (id) {
            this.containerType.set('DEFERRED_DAY_LOG');
            this.containerId.set(id);
            this.dayOrder.set(dayOrderStr ? Number(dayOrderStr) : null);
            this.weekLogId.set(null);
            this.selectedDate.set(date ?? '');
            this.loadDeferredDayLog(id);
        } else if (weekLogId && dayOrderStr !== null) {
            const dayOrder = Number(dayOrderStr);
            this.containerType.set('WEEK_LOG_DAY');
            this.containerId.set(null);
            this.dayOrder.set(dayOrder);
            this.weekLogId.set(weekLogId);
            this.selectedDate.set(date ?? '');
            this.loadWeekLogDay(weekLogId, dayOrder);
        } else {
            this.containerType.set('DEFERRED_DAY_LOG');
            this.containerId.set(null);
            this.dayOrder.set(null);
            this.weekLogId.set(null);
            this.selectedDate.set(date ?? '');
        }
    }

    ngOnDestroy(): void {
        // Clear editor context to prevent state leaking to other navigations (D7)
        this.ctxSvc.clearContext();
    }

    // ----- Data loading (owned by this page, not by WorkoutSessionEditor) -----

    private loadDeferredDayLog(id: string): void {
        this.loading.set(true);
        this.error.set(null);

        this.planDaySvc
            .findById(id)
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (dayLog) => {
                    if (dayLog) {
                        const ws: WorkoutSessionVM = {
                            id: dayLog.workoutSessionId || '',
                            date: dayLog.date,
                            exercises: dayLog.exercises || [],
                            status: (dayLog.status === 'complete'
                                ? 'complete'
                                : 'not_started') as StatusWorkoutSession,
                            notes: dayLog.notes,
                        };
                        this.workoutSession.set(ws);
                        this.exercises.set(ws.exercises);
                        this.selectedDate.set(dayLog.date);

                        if (dayLog.extraSessionIds?.length) {
                            this.loadExtraSessions(dayLog.extraSessionIds);
                        } else {
                            this.extraSessions.set([]);
                        }
                    } else {
                        this.workoutSession.set(null);
                        this.exercises.set([]);
                        this.extraSessions.set([]);
                    }
                },
                error: (err) => {
                    console.error('[DayDeferred] Error loading day-log:', err);
                    this.error.set('No se pudo cargar el día.');
                },
            });
    }

    private loadWeekLogDay(weekLogId: string, dayOrder: number): void {
        this.loading.set(true);
        this.error.set(null);

        this.planTrackingSvc
            .findById(weekLogId)
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (tracking) => {
                    const ws = tracking?.workouts?.[dayOrder];
                    if (ws) {
                        this.workoutSession.set(ws);
                        this.exercises.set(ws.exercises || []);
                        this.selectedDate.set(ws.date);

                        if (ws.extras?.length) {
                            this.loadExtraSessions(ws.extras);
                        } else {
                            this.extraSessions.set([]);
                        }
                    } else {
                        this.workoutSession.set(null);
                        this.exercises.set([]);
                        this.extraSessions.set([]);
                    }
                },
                error: (err) => {
                    console.error('[DayDeferred] Error loading week-log day:', err);
                    this.error.set('No se pudo cargar el día de la semana.');
                },
            });
    }

    private loadExtraSessions(ids: string[]): void {
        this.extraSessionApi.getByIds(ids).subscribe({
            next: (sessions) => this.extraSessions.set(sessions ?? []),
            error: (err) => console.error('[DayDeferred] Error loading extra sessions:', err),
        });
    }

    // ----- Save routing (D5): routes to correct mutation per container type -----

    onSave(workout: WorkoutSessionVM): void {
        if (!workout.id) {
            this.error.set('No hay una sesión de entrenamiento para actualizar.');
            return;
        }

        const ctx = this.editorContext();
        this.error.set(null);

        if (ctx.containerType === 'DEFERRED_DAY_LOG') {
            // Explicit route id — bypasses active state and storage (BR-019, BR-020)
            const dayLogId = this.containerId();
            if (!dayLogId) {
                this.error.set('No se pudo resolver el día diferido.');
                return;
            }

            this.planDaySvc.updateWorkoutSessionDeferred(dayLogId, workout).subscribe({
                next: () => {
                    this.workoutSession.set(workout);
                    this.exercises.set(workout.exercises || []);
                },
                error: (err) => {
                    console.error('[DayDeferred] Error saving day-log workout session:', err);
                    this.error.set('No se pudo guardar la sesión de entrenamiento.');
                },
            });
        } else if (ctx.containerType === 'WEEK_LOG_DAY') {
            // Week-log workouts require the parent week id. WorkoutApi is the WL
            // mutation (plan D5, tracking FR-008) and never touches WORKOUT_STORE.
            const weekLogId = this.weekLogId();
            if (!weekLogId) {
                this.error.set('No se pudo resolver la semana de entrenamiento.');
                return;
            }

            this.workoutApi.updateWorkoutSession(workout, weekLogId).subscribe({
                next: () => {
                    this.workoutSession.set(workout);
                    this.exercises.set(workout.exercises || []);
                },
                error: (err) => {
                    console.error('[DayDeferred] Error saving WL workout session:', err);
                    this.error.set('No se pudo guardar la sesión de entrenamiento.');
                },
            });
        }
    }

    // ----- Extra-session routing (D6): deferred-safe path -----

    onExtraSessionSave(extraSession: CreateExtraSessionForm): void {
        const ctx = this.editorContext();
        const id = this.containerId();

        if (ctx.containerType === 'DEFERRED_DAY_LOG' && id) {
            // updateExtraSessionDeferred bypasses active state and storage (BR-019, BR-020)
            this.planDaySvc.updateExtraSessionDeferred(id, extraSession).subscribe({
                next: () => this.loadDeferredDayLog(id),
                error: (err) => console.error('[DayDeferred] Error saving extra session:', err),
            });
        } else if (ctx.containerType === 'WEEK_LOG_DAY') {
            const weekLogId = this.weekLogId();
            const dayOrder = this.dayOrder();
            if (weekLogId && dayOrder !== null) {
                this.planTrackingSvc
                    .updateExtraSessionDeferred(weekLogId, dayOrder, extraSession)
                    .subscribe({
                        next: () => this.loadWeekLogDay(weekLogId, dayOrder),
                        error: (err) =>
                            console.error('[DayDeferred] Error saving WL extra session:', err),
                    });
            }
        }
    }

    onExtraSessionUpdate(data: {
        id: string;
        duration: number;
        intensityLevel: number;
        calories?: number;
        notes?: string;
    }): void {
        const input: UpdateExtraSessionInput = {
            id: data.id,
            duration: data.duration,
            intensityLevel: data.intensityLevel,
            calories: data.calories,
            notes: data.notes,
        };

        this.extraSessionApi.update(input).subscribe({
            next: (updated) => {
                this.extraSessions.update((current) =>
                    current.map((s) => (s.id === updated.id ? updated : s)),
                );
            },
            error: (err) => console.error('[DayDeferred] Error updating extra session:', err),
        });
    }

    onExtraSessionDelete(extraSessionId: string): void {
        const ctx = this.editorContext();

        if (ctx.containerType === 'DEFERRED_DAY_LOG') {
            this.planDaySvc.removeExtraSessionDeferred(extraSessionId).subscribe({
                next: () => {
                    this.extraSessions.update((current) =>
                        current.filter((s) => s.id !== extraSessionId),
                    );
                },
                error: (err) => console.error('[DayDeferred] Error removing extra session:', err),
            });
        } else if (ctx.containerType === 'WEEK_LOG_DAY') {
            const date = this.selectedDate();
            if (date) {
                this.planTrackingSvc.removeExtraSessionDeferred(date, extraSessionId).subscribe({
                    next: () => {
                        this.extraSessions.update((current) =>
                            current.filter((s) => s.id !== extraSessionId),
                        );
                    },
                    error: (err) =>
                        console.error('[DayDeferred] Error removing WL extra session:', err),
                });
            }
        }
    }

    onCompleteDay(): void {
        // TODO: Implement complete-day action when backend supports it
        // DL: ctxSvc.completeDeferredDayLog() — only when day-log is active
        // WL: pending backend dependency (AC-014)
    }

    onCloseEditor(): void {
        // No-op for now; could navigate back
    }
}
