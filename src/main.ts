import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, HttpHeaders } from '@angular/common/http';
import { AppComponent } from './app/app';
import { routes } from './app/app.routes';
import { provideApollo } from 'apollo-angular';
import { inject } from '@angular/core';
import { HttpLink } from 'apollo-angular/http';
import { ApolloLink, InMemoryCache } from '@apollo/client';
import { provideAnimations } from '@angular/platform-browser/animations';
import { environment } from './environments/environments';

bootstrapApplication(AppComponent, {
    providers: [
        provideAnimations(),
        provideRouter(routes),
        provideHttpClient(),
        provideApollo(() => {
            const httpLink = inject(HttpLink);

            // Configura la URL desde environment
            const uri = environment.graphqlUri;

            // (Opcional) Middleware para añadir auth headers
            const authLink = new ApolloLink((operation, forward) => {
                const token = localStorage.getItem('token');
                if (token) {
                    operation.setContext({
                        headers: new HttpHeaders().set('Authorization', `Bearer ${token}`),
                    });
                }
                return forward(operation);
            });

            return {
                link: ApolloLink.from([authLink, httpLink.create({ uri })]),
                cache: new InMemoryCache(),
            };
        }),
    ],
});
