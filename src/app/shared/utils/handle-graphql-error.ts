import { catchError, OperatorFunction, of, throwError } from 'rxjs';
import { AuthService } from '../../core/services/auth/auth.service';
import { CombinedGraphQLErrors } from '@apollo/client';
import { GraphQLFormattedError } from 'graphql';
import { HttpErrorResponse } from '@angular/common/http';

export function handleGraphqlError<T>(authSvc: AuthService): OperatorFunction<T, T> {
    return catchError((error) => {
        // console.log('handleGraphqlError', error);
        // console.log(CombinedGraphQLErrors.is(error));

        if (CombinedGraphQLErrors.is(error)) {
            // TypeScript now knows `error` is a `CombinedGraphQLErrors` object
            const [errors] = formattedGraphQLErrors(error);

            console.log('err', errors);
            if (errors.message === 'Unauthorized') {
                authSvc.logout();
                throwError(() => new Error('UNAUTHORIZED'));
            }
        }
        console.log(error.message);
        const graphQLError = error?.graphQLErrors?.[0];

        // 🔍 Caso 2: HttpErrorResponse con `error.errors[]`
        if (error instanceof HttpErrorResponse) {
            const gqlErrors = error.error?.errors;

            if (Array.isArray(gqlErrors) && gqlErrors.length > 0) {
                // Control especial de UNAUTHORIZED
                const unauthorized = gqlErrors.find(
                    (e: any) => e?.extensions?.code === 'UNAUTHORIZED'
                );
                if (unauthorized) {
                    authSvc.logout();
                    return throwError(() => new Error('UNAUTHORIZED'));
                }

                // devolvés TODOS los errores
                return throwError(() => gqlErrors);
            }
        }

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
