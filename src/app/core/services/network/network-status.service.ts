import { Injectable, signal, OnDestroy } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NetworkStatusService implements OnDestroy {
    isOnline = signal<boolean>(navigator.onLine);

    private updateOnlineStatus = () => {
        this.isOnline.set(navigator.onLine);
    };

    constructor() {
        window.addEventListener('online', this.updateOnlineStatus);
        window.addEventListener('offline', this.updateOnlineStatus);
    }

    ngOnDestroy() {
        window.removeEventListener('online', this.updateOnlineStatus);
        window.removeEventListener('offline', this.updateOnlineStatus);
    }
}
