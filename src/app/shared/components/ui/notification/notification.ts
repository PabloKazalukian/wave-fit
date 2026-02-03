import { Component, input, computed, output, signal } from '@angular/core';

@Component({
    selector: 'app-notification',
    standalone: true,
    templateUrl: './notification.html',
})
export class Notification {
    message = input<string>('');
    type = input<'success' | 'error' | 'warning' | 'info'>('info');
    isVisible = input<boolean>(true);

    // Output para emitir al padre cuando se cierre
    onClose = output<void>();

    animationClass = signal('animate-slide-in');

    icon = computed(() => {
        const map = {
            success: '✓',
            error: '✕',
            warning: '!',
            info: 'i',
        } as const;
        return map[this.type()];
    });

    iconBgClass = computed(() => {
        const map = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500',
        } as const;
        return map[this.type()];
    });

    close() {
        this.animationClass.set('animate-slide-out');
        setTimeout(() => {
            this.onClose.emit();
        }, 300);
    }
}
