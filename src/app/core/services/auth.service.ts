import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private storageKey = 'auth_user';

    login(username: string, password: string): boolean {
        // Simula validación contra una API
        if (username === 'admin' && password === '1234') {
            localStorage.setItem(this.storageKey, JSON.stringify({ username }));
            return true;
        }
        return false;
    }

    logout(): void {
        localStorage.removeItem(this.storageKey);
    }

    isAuthenticated(): boolean {
        return localStorage.getItem(this.storageKey) !== null;
    }

    getUser(): any {
        return JSON.parse(localStorage.getItem(this.storageKey) || 'null');
    }
}
