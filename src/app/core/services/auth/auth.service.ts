import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private storageKey = 'auth_user';

    // Signals de estado
    user = signal<any | null>(this.getStoredUser());
    isAuthenticated = signal<boolean>(!!this.getStoredUser());

    login(username: string, password: string): boolean {
        if (username === 'admin' && password === '1234') {
            const userData = { username };
            localStorage.setItem(this.storageKey, JSON.stringify(userData));
            this.user.set(userData);
            this.isAuthenticated.set(true);
            return true;
        }
        return false;
    }

    logout(): void {
        localStorage.removeItem(this.storageKey);
        this.user.set(null);
        this.isAuthenticated.set(false);
    }

    private getStoredUser(): any {
        return JSON.parse(localStorage.getItem(this.storageKey) || 'null');
    }
}
