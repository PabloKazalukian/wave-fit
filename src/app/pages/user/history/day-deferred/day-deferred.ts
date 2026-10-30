import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EditorContext } from '../../../../core/services/editor-context/editor-context.interface';
import { EditorContextService } from '../../../../core/services/editor-context/editor-context.service';
import { WORKOUT_STORE } from '../../../../core/services/workouts/workout-store.interface';
import { TextLink } from '../../../../shared/components/ui/text-link/text-link';
import { Calendar, LucideAngularModule } from 'lucide-angular';
import { WorkoutSessionEditor } from '../../../../shared/components/widgets/tracking/workout-session-editor/workout-session-editor';

@Component({
    selector: 'app-day-deferred',
    standalone: true,
    imports: [TextLink, LucideAngularModule, WorkoutSessionEditor],
    templateUrl: './day-deferred.html',
    styles: ``,
})
export class DayDeferred implements OnInit {
    readonly CalendarIcon = Calendar;
    private readonly route = inject(ActivatedRoute);
    private readonly ctxSvc = inject(EditorContextService);
    private readonly store = inject(WORKOUT_STORE);

    /** Fecha seleccionada desde los query params */
    readonly date = signal<string | null>(null);

    /** Contexto de edición determinado por los query params */
    readonly containerType = signal<'DEFERRED_DAY_LOG' | 'WEEK_LOG_DAY'>('DEFERRED_DAY_LOG');
    readonly containerId = signal<string | null>(null);
    readonly dayOrder = signal<number | null>(null);
    readonly weekLogId = signal<string | null>(null);

    /** Estado de carga y errores */
    readonly loading = signal(false);
    readonly error = signal<string | null>(null);

    /** Workout session desde el store (reutilizable en ambos contextos) */
    readonly workoutSession = this.store.workoutSession;
    readonly selectedDate = this.store.selectedDate;
    readonly exercisesSelected = this.store.exercises;

    /** Contexto de edición computed desde los query params y el contexto */
    readonly editorContext = computed<EditorContext>(() => ({
        containerType: this.containerType(),
        containerId: this.containerId() ?? undefined,
        dayOrder: this.dayOrder() ?? undefined,
        weekLogId: this.weekLogId() ?? undefined,
    }));

    ngOnInit() {
        const queryParams = this.route.snapshot.queryParamMap;
        const routeParams = this.route.snapshot.paramMap;

        const date = queryParams.get('date');
        const id = queryParams.get('id');
        const weekLogId = routeParams.get('weekLogId');
        const dayOrderStr = routeParams.get('dayOrder');
        const dayOrder = dayOrderStr ? Number(dayOrderStr) : undefined;

        this.date.set(date ?? null);

        // Detectar contexto basado en los parámetros de la ruta y query params
        // Prioridad: id (DL) > weekLogId + dayOrder (WL) > solo date (DL vacío)
        if (id) {
            // Contexto: Day-Log diferido (DL)
            this.containerType.set('DEFERRED_DAY_LOG');
            this.containerId.set(id);
            this.dayOrder.set(dayOrder ?? null);
            this.weekLogId.set(null);
            this.ctxSvc.setContext({
                containerType: 'DEFERRED_DAY_LOG',
                containerId: id,
                dayOrder,
                weekLogId: undefined,
            });
        } else if (weekLogId && dayOrder !== undefined) {
            // Contexto: Día dentro de week-log (WL)
            this.containerType.set('WEEK_LOG_DAY');
            this.containerId.set(null);
            this.dayOrder.set(dayOrder);
            this.weekLogId.set(weekLogId);
            this.ctxSvc.setContext({
                containerType: 'WEEK_LOG_DAY',
                containerId: undefined,
                dayOrder,
                weekLogId,
            });
        } else {
            // Sin ID relevante: formulario vacío para nuevo día diferido (DL)
            this.containerType.set('DEFERRED_DAY_LOG');
            this.containerId.set(null);
            this.dayOrder.set(null);
            this.weekLogId.set(null);
            this.ctxSvc.setContext({
                containerType: 'DEFERRED_DAY_LOG',
                containerId: undefined,
                dayOrder: undefined,
                weekLogId: undefined,
            });
        }
    }

    /** Complete Day action - dispatches según el contexto determinado por el editor */
    onCompleteDay(): void {
        // El WorkoutSessionEditor leerá el ctx y hará la operación correcta
        // (completeDayLog para DL o pending para WL hasta que backend esté listo)
        this.ctxSvc.completeDeferredDayLog();
    }

    /** Save workout session */
    onSave(): void {
        // Esta acción es manejada por el WorkoutSessionEditor
        // pero podemos agregar lógica aquí si es necesario
    }

    /** Close dialog */
    closeDialog(): void {
        // Esta acción es manejada por el WorkoutSessionEditor
    }
}
