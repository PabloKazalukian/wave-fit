import { Component, input, computed, output, signal, OnInit, OnDestroy } from '@angular/core';

@Component({
    selector: 'app-notification',
    standalone: true,
    templateUrl: './notification.html',
})
export class Notification implements OnInit, OnDestroy {
    message = input<string>('');
    type = input<'success' | 'error' | 'warning' | 'info'>('info');
    isVisible = input<boolean>(true);
    duration = input<number>(5000);

    closeOuput = output<void>();

    animationClass = signal('animate-slide-in');

    private autoCloseTimer: ReturnType<typeof setTimeout> | undefined;

    ngOnInit(): void {
        this.startAutoClose();
    }

    ngOnDestroy(): void {
        this.clearAutoClose();
    }

    private startAutoClose() {
        this.clearAutoClose();
        const duration = this.duration();
        if (duration > 0) {
            this.autoCloseTimer = setTimeout(() => this.close(), duration);
        }
    }

    private clearAutoClose() {
        if (this.autoCloseTimer) {
            clearTimeout(this.autoCloseTimer);
            this.autoCloseTimer = undefined;
        }
    }

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
        this.clearAutoClose();
        this.animationClass.set('animate-slide-out');
        setTimeout(() => {
            this.closeOuput.emit();
        }, 300);
    }
}
