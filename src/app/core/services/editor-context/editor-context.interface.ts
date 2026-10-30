export interface EditorContext {
    /** Tipo de contenedor: 'DEFERRED_DAY_LOG' o 'WEEK_LOG_DAY' */
    containerType: 'DEFERRED_DAY_LOG' | 'WEEK_LOG_DAY';

    /** ID del contenedor dueño (day-log id o week-log id) */
    containerId?: string;

    /** Orden del día dentro de un week-log (0-6). Solo para WEEK_LOG_DAY. */
    dayOrder?: number;

    /** ID del week-log padre. Solo para WEEK_LOG_DAY. */
    weekLogId?: string;
}
