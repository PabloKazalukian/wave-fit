import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, Router, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { AppComponent } from './app/app';
import { routes } from './app/app.routes';
import { provideApollo } from 'apollo-angular';
import { enableProdMode, inject, Injector } from '@angular/core';
import { HttpLink } from 'apollo-angular/http';
import { ApolloLink, CombinedGraphQLErrors, InMemoryCache } from '@apollo/client';
import { ErrorLink } from '@apollo/client/link/error';
import { provideAnimations } from '@angular/platform-browser/animations';
import { environment } from './environments/environments';
import { provideAuthInitializer } from './app/core/auth/auth.initializer';
import { AuthService } from './app/core/services/auth/auth.service';

if (environment.production) {
    enableProdMode();
}

bootstrapApplication(AppComponent, {
    providers: [
        provideAnimations(),
        provideRouter(routes, withInMemoryScrolling({ anchorScrolling: 'enabled' })),
        provideHttpClient(),
        provideAuthInitializer(),
        provideApollo(() => {
            const httpLink = inject(HttpLink);
            const injector = inject(Injector);

            const uri = environment.graphqlUri;

            let isHandlingAuthError = false;

            const errorLink = new ErrorLink(({ error }) => {
                let unauthorized = false;

                if (CombinedGraphQLErrors.is(error)) {
                    for (const gqlError of error.errors) {
                        const code = gqlError.extensions?.['code'];
                        if (code === 'UNAUTHENTICATED' || code === 'UNAUTHORIZED') {
                            unauthorized = true;
                            break;
                        }
                    }
                } else {
                    // Network error (ej: 401 HTTP)
                    if ((error as unknown as { status: number })?.status === 401) {
                        unauthorized = true;
                    }
                }

                if (unauthorized && !isHandlingAuthError) {
                    isHandlingAuthError = true;

                    // console.warn(
                    //     '[Interceptor] Autenticación fallida o token expirado (401 / UNAUTHENTICATED). Cerrando sesión y redirigiendo al login...',
                    // );

                    const authService = injector.get(AuthService);
                    const router = injector.get(Router);

                    authService.logout();

                    setTimeout(() => {
                        router.navigate(['/auth/login']);
                        isHandlingAuthError = false;
                    }, 500);
                }
            });

            return {
                link: ApolloLink.from([errorLink, httpLink.create({ uri, withCredentials: true })]),
                cache: new InMemoryCache(),
            };
        }),
    ],
}).then(() => {
    if ('serviceWorker' in navigator && !environment.production) {
        // In dev mode, unregister any stale Service Workers left from a PWA build run.
        // This prevents "ServiceWorker script evaluation failed" errors during ng serve.
        navigator.serviceWorker.getRegistrations().then((registrations) => {
            for (const registration of registrations) {
                registration.unregister();
            }
        });
    }

    if ('serviceWorker' in navigator && environment.production) {
        import('workbox-window').then(({ Workbox }) => {
            const wb = new Workbox('/sw.js');

            wb.addEventListener('installed', (event) => {
                if (event.isUpdate) {
                    if (confirm('Nueva versión disponible. ¿Deseas actualizar?')) {
                        window.location.reload();
                    }
                }
            });

            wb.register().catch((err) => {
                console.error('Service Worker registration failed:', err);
            });
        });
    }
});
