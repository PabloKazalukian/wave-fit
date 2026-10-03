import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, inject, Injector } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router, withInMemoryScrolling } from '@angular/router';
import { ApolloLink, CombinedGraphQLErrors, InMemoryCache } from '@apollo/client';
import { ErrorLink } from '@apollo/client/link/error';
import { provideApollo } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { provideHighcharts } from 'highcharts-angular';

import { environment } from '../environments/environments';
import { provideAuthInitializer } from './core/auth/auth.initializer';
import { AuthService } from './core/services/auth/auth.service';
import { WORKOUT_STORE } from './core/services/workouts/workout-store.interface';
import { workoutStoreByMode } from './core/services/workouts/workout-store.mode';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
    providers: [
        provideAnimations(),
        provideRouter(routes, withInMemoryScrolling({ anchorScrolling: 'enabled' })),
        provideHttpClient(),
        provideAuthInitializer(),
        { provide: WORKOUT_STORE, useFactory: workoutStoreByMode },
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
        provideHighcharts(),
    ],
};
