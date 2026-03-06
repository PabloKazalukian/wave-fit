import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TokenStorage {
    private readonly userKey = 'auth_user';

    getUser(): any | null {
        const data = localStorage.getItem(this.userKey);
        try {
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    }

    setUser(user: any): void {
        localStorage.setItem(this.userKey, JSON.stringify(user));
    }

    clear(): void {
        localStorage.removeItem(this.userKey);
    }
}
