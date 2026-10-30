import { Component, input, output, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { EditorContext } from '../../../../../core/services/editor-context/editor-context.interface';
import { EditorContextService } from '../../../../../core/services/editor-context/editor-context.service';
import { PlanDayService } from '../../../../../core/services/day-logs/plan-day.service';
import { PlanTrackingService } from '../../../../../core/services/trackings/plan-tracking.service';
import { TrackingWorkoutFacade } from '../tracking-workout/tracking-workout.facade';
import {
    ExercisePerformanceVM,
    StatusWorkoutSession,
    WorkoutSessionVM,
} from '../../../../interfaces/tracking.interface';
import { BtnComponent } from '../../../ui/btn/btn';
import { Loading } from '../../../ui/loading/loading';
import { OrchestratorComponent } from './orchestrator.component';

@Component({
    selector: 'app-workout-session-editor',
    standalone: true,
    imports: [CommonModule, OrchestratorComponent, Loading, BtnComponent],
    templateUrl: './workout-session-editor.html',
    styles: ``,
})
export class WorkoutSessionEditor {
    editorContext = input.required<EditorContext>();

    // Outputs - emitted to parent DayDeferred
    save = output<void>();
    closeEditor = output<void>();
    completeDay = output<void>();

    private ctxSvc = inject(EditorContextService);
    private planDaySvc = inject(PlanDayService);
    private planTrackingSvc = inject(PlanTrackingService);
    private facade = inject(TrackingWorkoutFacade);

    loading = signal(false);
    isDialogOpen = signal(false);

    workoutSession = signal<WorkoutSessionVM | null>(null);
    exercises = signal<ExercisePerformanceVM[]>([]);
    selectedDate = signal<string>('');

    constructor() {
        effect(() => {
            const ctx = this.editorContext();
            this.ctxSvc.setContext(ctx);
            this.loadSession(ctx);
        });
    }

    private loadSession(ctx: EditorContext): void {
        // PRIORITY: Use workoutSession input data first (from day-deferred WORKOUT_STORE)
        // Only fall back to API fetching if no input data is available
        const inputWk = this.workoutSession();

        if (inputWk && inputWk.id) {
            // Input data already available from store - use it directly
            this.exercises.set(inputWk.exercises || []);
            this.selectedDate.set(inputWk.date);
            this.loading.set(false);
            return;
        }

        // FALLBACK: Fetch from API since no input data available
        if (ctx.containerType === 'DEFERRED_DAY_LOG') {
            if (ctx.containerId) {
                this.loading.set(true);
                this.planDaySvc
                    .findById(ctx.containerId)
                    .pipe(finalize(() => this.loading.set(false)))
                    .subscribe({
                        next: (dayLog) => {
                            if (dayLog) {
                                const ws: WorkoutSessionVM = {
                                    id: dayLog.workoutSessionId || dayLog.id,
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
                            } else {
                                this.resetSession();
                            }
                        },
                        error: (err) => {
                            console.error('Error loading deferred day-log:', err);
                            this.resetSession();
                        },
                    });
            } else {
                this.resetSession();
            }
        } else if (ctx.containerType === 'WEEK_LOG_DAY') {
            if (ctx.weekLogId && ctx.dayOrder !== undefined) {
                this.loading.set(true);
                this.planTrackingSvc
                    .findById(ctx.weekLogId)
                    .pipe(finalize(() => this.loading.set(false)))
                    .subscribe({
                        next: (tracking) => {
                            const ws = tracking?.workouts?.[ctx.dayOrder!];
                            if (ws) {
                                this.workoutSession.set(ws);
                                this.exercises.set(ws.exercises || []);
                                this.selectedDate.set(ws.date);
                            } else {
                                this.resetSession();
                            }
                        },
                        error: (err) => {
                            console.error('Error loading week-log day:', err);
                            this.resetSession();
                        },
                    });
            } else {
                this.resetSession();
            }
        }
    }

    private resetSession(date = ''): void {
        this.workoutSession.set({
            id: '',
            date,
            exercises: [],
            status: 'not_started',
        });
        this.exercises.set([]);
        this.selectedDate.set(date);
    }

    openDialog(): void {
        this.isDialogOpen.set(true);
    }

    closeDialog(): void {
        this.isDialogOpen.set(false);
        this.closeEditor.emit();
    }

    onSave(updatedWorkout?: WorkoutSessionVM): void {
        const ctx = this.editorContext();
        const workout = updatedWorkout || this.workoutSession();
        if (!workout) return;

        if (ctx.containerType === 'DEFERRED_DAY_LOG') {
            // T2: DL API mutation (PlanDayApi.updateWorkoutSession via PlanDayService)
            // Mutación directa, sin tocar estado de active tracking ni storage (BR-019, BR-020)
            this.planDaySvc.updateWorkoutSession(workout);
            this.workoutSession.set(workout);
            this.exercises.set(workout.exercises || []);
            this.save.emit();
            this.closeDialog();
        } else if (ctx.containerType === 'WEEK_LOG_DAY') {
            // T3: WL store update via facade (local-only, BR-020)
            this.facade.updateWorkoutSession(workout);
            this.workoutSession.set(workout);
            this.exercises.set(workout.exercises || []);
            this.save.emit();
            this.closeDialog();
        }
    }

    onCompleteDay(): void {
        const ctx = this.editorContext();
        if (ctx.containerType === 'DEFERRED_DAY_LOG') {
            this.ctxSvc.completeDeferredDayLog();
            this.completeDay.emit();
        } else if (ctx.containerType === 'WEEK_LOG_DAY') {
            console.log('Completing week-log day - pending backend dependency (AC-014)');
            // TODO: Cuando backend esté disponible, invocar operación de completion de week-log day
            // Que complete solo el día sin afectar parent week-log ni otros días (BR-009, BR-017)
            this.completeDay.emit();
        }
    }
}
