import { Component, input, computed, output, signal, effect } from '@angular/core';

@Component({
    selector: 'app-notification',
    standalone: true,
    templateUrl: './notification.html',
})
export class Notification {
    message = input<string>('');
    type = input<'success' | 'error' | 'warning' | 'info'>('info');
    isVisible = input<boolean>(true);

    shouldRender = signal(true);
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
            this.shouldRender.set(false);
        }, 300);
    }
}
