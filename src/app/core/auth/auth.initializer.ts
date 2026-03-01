import { APP_INITIALIZER, Provider } from '@angular/core';
import { AuthService } from '../services/auth/auth.service';
import { TokenStorage } from './token.storage';
import { firstValueFrom, catchError, of, timeout } from 'rxjs';

export function authInitializerFactory(authService: AuthService, tokenStorage: TokenStorage) {
    return () => {
        const currentUrl = window.location.pathname;

        if (currentUrl.startsWith('/auth/login') || currentUrl.startsWith('/auth/register')) {
            return Promise.resolve(true);
        }

        if (tokenStorage.hasToken()) {
            return firstValueFrom(
                authService.me().pipe(
                    timeout(5000),
                    catchError(() => {
                        authService.logout();
                        return of(true);
                    }),
                ),
            ).then(() => true);
        }

        return Promise.resolve(true);
    };
}

export const provideAuthInitializer = (): Provider => ({
    provide: APP_INITIALIZER,
    useFactory: authInitializerFactory,
    deps: [AuthService, TokenStorage],
    multi: true,
});
