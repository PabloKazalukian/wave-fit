import { Component, input, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditorContext } from '../../../../../core/services/editor-context/editor-context.interface';
import { EditorContextService } from '../../../../../core/services/editor-context/editor-context.service';

@Component({
    selector: 'app-workout-session-editor',
    standalone: true,
    imports: [CommonModule, // Orchestrator manages the three reusable components
    ],
    template: `<app-orchestrator></app-orchestrator>`,
    styles: ``,
})
export class WorkoutSessionEditor {
    editorContext = input.required<EditorContext>();

    private ctxSvc = inject(EditorContextService);

    isDialogOpen = signal(false);

    constructor() {
        effect(() => {
            this.ctxSvc.setContext(this.editorContext());
        });
    }

    openDialog(): void {
        this.isDialogOpen.set(true);
    }

    closeDialog(): void {
        this.isDialogOpen.set(false);
    }

    onSave(): void {
        // Delegated to orchestrator
    }

    onCompleteDay(): void {
        const ctx = this.editorContext();
        if (ctx.containerType === 'DEFERRED_DAY_LOG') {
            this.ctxSvc.completeDeferredDayLog();
        } else if (ctx.containerType === 'WEEK_LOG_DAY') {
            console.log('Completing week-log day - pending backend dependency (AC-014)');
            // TODO: Cuando backend esté disponible, invocar operación de completion de week-log day
            // Que complete solo el día sin afectar parent week-log ni otros días (BR-009, BR-017)
        }
    }
}