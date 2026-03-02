import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient, HttpHeaders } from '@angular/common/http';
import { AppComponent } from './app/app';
import { routes } from './app/app.routes';
import { provideApollo } from 'apollo-angular';
import { enableProdMode, inject, Injector } from '@angular/core';
import { HttpLink } from 'apollo-angular/http';
import { ApolloLink, CombinedGraphQLErrors, InMemoryCache } from '@apollo/client';
import { ErrorLink, onError } from '@apollo/client/link/error';
import { provideAnimations } from '@angular/platform-browser/animations';
import { environment } from './environments/environments';
import { provideAuthInitializer } from './app/core/auth/auth.initializer';
import { TokenStorage } from './app/core/auth/token.storage';
import { AuthService } from './app/core/services/auth/auth.service';

if (environment.production) {
    enableProdMode();
}

bootstrapApplication(AppComponent, {
    providers: [
        provideAnimations(),
        provideRouter(routes),
        provideHttpClient(),
        provideAuthInitializer(),
        provideApollo(() => {
            const httpLink = inject(HttpLink);
            const tokenStorage = inject(TokenStorage);
            const injector = inject(Injector);

            const uri = environment.graphqlUri;

            let isHandlingAuthError = false;

            const errorLink = new ErrorLink(({ error }) => {
                let unauthorized = false;

                if (CombinedGraphQLErrors.is(error)) {
                    for (const gqlError of error.errors) {
                        if (gqlError.extensions?.['code'] === 'UNAUTHENTICATED') {
                            unauthorized = true;
                            break;
                        }
                    }
                } else {
                    // Network error (ej: 401 HTTP)
                    if ((error as any)?.status === 401) {
                        unauthorized = true;
                    }
                }

                if (unauthorized && !isHandlingAuthError) {
                    isHandlingAuthError = true;

                    const authService = injector.get(AuthService);
                    authService.logout();

                    setTimeout(() => {
                        isHandlingAuthError = false;
                    }, 500);
                }
            });

            const authLink = new ApolloLink((operation, forward) => {
                const token = tokenStorage.getToken();

                if (token) {
                    operation.setContext({
                        headers: new HttpHeaders().set('Authorization', `Bearer ${token}`),
                    });
                }

                return forward(operation);
            });

            return {
                link: ApolloLink.from([errorLink, authLink, httpLink.create({ uri })]),
                cache: new InMemoryCache(),
            };
        }),
    ],
});
