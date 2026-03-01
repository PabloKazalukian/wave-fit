import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient, HttpHeaders } from '@angular/common/http';
import { AppComponent } from './app/app';
import { routes } from './app/app.routes';
import { provideApollo } from 'apollo-angular';
import { enableProdMode, inject, Injector } from '@angular/core';
import { HttpLink } from 'apollo-angular/http';
import { ApolloLink, InMemoryCache } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
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

            // Configura la URL desde environment
            const uri = environment.graphqlUri;

            const errorLink = onError(({ error }) => {
                let unauthorized = false;

                const graphQLErrors = (error as any)?.graphQLErrors;
                const networkError = (error as any)?.networkError;

                if (graphQLErrors) {
                    for (const err of graphQLErrors) {
                        if (
                            err.extensions?.code === 'UNAUTHENTICATED' ||
                            err.message.includes('Unauthorized')
                        ) {
                            unauthorized = true;
                        }
                    }
                }

                if (networkError?.statusCode === 401) {
                    unauthorized = true;
                }

                if (unauthorized) {
                    injector.get(AuthService).logout();
                    injector.get(Router).navigate(['/auth/login']);
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
