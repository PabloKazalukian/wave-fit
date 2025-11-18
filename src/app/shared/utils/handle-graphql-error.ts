import { catchError, OperatorFunction, of, throwError } from 'rxjs';
import { AuthService } from '../../core/services/auth/auth.service';
import { CombinedGraphQLErrors } from '@apollo/client';
import { GraphQLFormattedError } from 'graphql';

export function handleGraphqlError<T>(authSvc: AuthService): OperatorFunction<T, T> {
    return catchError((error) => {
        if (CombinedGraphQLErrors.is(error)) {
            // TypeScript now knows `error` is a `CombinedGraphQLErrors` object
            const [errors] = formattedGraphQLErrors(error);

            console.log(errors);
            if (errors.message === 'Unauthorized') {
                authSvc.logout();
                throwError(() => new Error('UNAUTHORIZED'));
            }
        }
        console.log(error.message);
        const graphQLError = error?.graphQLErrors?.[0];

        if (graphQLError?.extensions?.code === 'UNAUTHORIZED') {
            console.warn('Sesión expirada o token inválido. Cerrando sesión...');
            authSvc.logout();
            // devolvés un observable vacío o falso según tu flujo
            throwError(() => new Error('UNAUTHORIZED'));
            // return of() as any;
        }

        console.error('GraphQL Error:', graphQLError);
        return throwError(() => ({
            message: graphQLError?.message || 'Error desconocido',
            code: graphQLError?.extensions?.code || 'UNKNOWN',
        }));
    });
}

function formattedGraphQLErrors(error: CombinedGraphQLErrors): readonly GraphQLFormattedError[] {
    return error.errors;
}
