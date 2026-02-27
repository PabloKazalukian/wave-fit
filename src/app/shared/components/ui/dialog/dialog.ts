import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate, keyframes, style, transition, trigger } from '@angular/animations';

@Component({
    selector: 'app-dialog',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './dialog.html',
    animations: [
        trigger('backdropAnimation', [
            transition(':enter', [
                style({ opacity: 0 }),
                animate('200ms ease-out', style({ opacity: 1 })),
            ]),
            transition(':leave', [animate('200ms ease-in', style({ opacity: 0 }))]),
        ]),
        trigger('slideUp', [
            transition(':enter', [
                style({ transform: 'translateY(100%)', opacity: 0 }),
                animate(
                    '300ms cubic-bezier(0.32, 0.72, 0, 1)',
                    style({ transform: 'translateY(0)', opacity: 1 }),
                ),
            ]),
            transition(':leave', [
                animate(
                    '250ms cubic-bezier(0.32, 0.72, 0, 1)',
                    style({ transform: 'translateY(100%)', opacity: 0 }),
                ),
            ]),
        ]),
        trigger('shake', [
            transition('idle => shaking', [
                animate(
                    '500ms ease-in-out',
                    keyframes([
                        style({ transform: 'translateY(0px)', offset: 0 }),
                        style({ transform: 'translateY(-10px)', offset: 0.15 }),
                        style({ transform: 'translateY(6px)', offset: 0.35 }),
                        style({ transform: 'translateY(-6px)', offset: 0.55 }),
                        style({ transform: 'translateY(3px)', offset: 0.75 }),
                        style({ transform: 'translateY(0px)', offset: 1 }),
                    ]),
                ),
            ]),
        ]),
        trigger('backdropPulse', [
            transition('idle => pulsing', [
                animate(
                    '500ms ease-in-out',
                    keyframes([
                        style({ backgroundColor: 'rgba(0,0,0,0.6)', offset: 0 }),
                        style({ backgroundColor: 'rgba(0,0,0,0.82)', offset: 0.3 }),
                        style({ backgroundColor: 'rgba(0,0,0,0.6)', offset: 1 }),
                    ]),
                ),
            ]),
        ]),
    ],
})
export class DialogComponent {
    /** Controla si el dialog está visible */
    isOpen = input<boolean>(false);

    /** Título opcional del dialog */
    title = input<string>('');

    /** Si true, cerrar al hacer click en el backdrop */
    closeOnBackdrop = input<boolean>(true);

    /**
     * Si true, el backdrop NO cierra el dialog y muestra
     * una animación de "atención requerida" al intentarlo.
     */
    locked = input<boolean>(false);

    /** Evento emitido al cerrar el dialog */
    closed = output<void>();

    /** Estado interno para la animación de shake */
    shakeState = signal<'idle' | 'shaking'>('idle');
    backdropState = signal<'idle' | 'pulsing'>('idle');

    close() {
        this.closed.emit();
    }

    onBackdropClick() {
        if (this.locked()) {
            this.triggerLockedAnimation();
            return;
        }
        if (this.closeOnBackdrop()) {
            this.close();
        }
    }

    private triggerLockedAnimation() {
        if (this.shakeState() === 'shaking') return; // evitar re-trigger

        this.shakeState.set('shaking');
        this.backdropState.set('pulsing');

        setTimeout(() => {
            this.shakeState.set('idle');
            this.backdropState.set('idle');
        }, 520);
    }
}
