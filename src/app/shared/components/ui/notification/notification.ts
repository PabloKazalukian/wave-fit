import { Component, input, computed } from '@angular/core';

@Component({
    selector: 'app-notification',
    standalone: true,
    templateUrl: './notification.html',
})
export class Notification {
    message = input<string>();
    type = input<'success' | 'error' | 'warning' | 'info'>('info');

    icon = computed(() => {
        const map = {
            success: '✔',
            error: '✖',
            warning: '⚠',
            info: 'ℹ',
        } as const;
        return map[this.type()];
    });

    colorClass = computed(() => {
        const map = {
            success: 'bg-success',
            error: 'bg-error',
            warning: 'bg-warning',
            info: 'bg-info',
        } as const;
        return map[this.type()];
    });
}
