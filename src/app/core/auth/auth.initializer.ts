import { APP_INITIALIZER, Provider } from '@angular/core';
import { AuthService } from '../services/auth/auth.service';
import { TokenStorage } from './token.storage';
import { firstValueFrom, catchError, of, timeout } from 'rxjs';

export function authInitializerFactory(authService: AuthService) {
    return async () => {
        const currentUrl = window.location.pathname;

        if (currentUrl.startsWith('/auth/login') || currentUrl.startsWith('/auth/register')) {
            return true;
        }

        // Hydrate state from IndexedDB before anything else
        await authService.initializeUserFromStorage();

        if (authService.hasSession()) {
            try {
                // Try to refresh user data from network, but don't block if offline
                await firstValueFrom(
                    authService.me().pipe(
                        timeout(3000), // Short timeout for initial load
                        catchError(() => of(true)),
                    ),
                );
            } catch (e) {
                // Network failed or timeout, but we have the offline session from IndexedDB
                console.warn('Initial auth sync failed, proceeding with offline state');
            }
        }

        return true;
    };
}

export const provideAuthInitializer = (): Provider => ({
    provide: APP_INITIALIZER,
    useFactory: authInitializerFactory,
    deps: [AuthService, TokenStorage],
    multi: true,
});
