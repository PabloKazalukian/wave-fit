# Autenticación y Apollo en Wave-fit

Este documento detalla el funcionamiento del sistema de autenticación de Wave-fit, la integración con Apollo Client en Angular y el manejo de tokens tanto locales como de Google.

## Arquitectura de Autenticación

El sistema utiliza **Passport.js** en el backend para manejar múltiples estrategias de autenticación en un mismo guard de GraphQL (`GqlAuthGuard`).

### Estrategias Soportadas

1.  **JWT Local**: Valida tokens emitidos por nuestra propia API. El secreto se maneja via `ConfigService` con un fallback seguro.
2.  **Google Token**: Valida un `id_token` emitido directamente por Google. Esto permite que el frontend use el token social sin necesidad de intercambiarlo por uno local inmediatamente si así se requiere.

### Backend (NestJS)

- **`GqlAuthGuard`**: Protege los resolvers. Soporta el orden de estrategias `['jwt', 'google-token']`. Si la primera falla, intenta con la segunda.
- **`AuthModule`**: Configura el `JwtModule` de forma asíncrona para garantizar que los secretos de entorno estén cargados antes de emitir tokens.
- **`GoogleTokenStrategy`**: Estrategia personalizada que utiliza `GoogleService` para verificar la validez del token contra los servidores de Google y retornar el usuario correspondiente (o crearlo si no existe).

---

## Integración Apollo (Frontend)

La configuración de Apollo se encuentra centralizada en `src/main.ts` y utiliza una arquitectura de "Links" encadenados.

### 1. Inyección de Token (`authLink`)

Cada petición saliente intercepta el `TokenStorage` para adjuntar el encabezado de autorización:

```typescript
const authLink = new ApolloLink((operation, forward) => {
    const token = tokenStorage.getToken();
    if (token) {
        operation.setContext({
            headers: new HttpHeaders().set('Authorization', `Bearer ${token}`),
        });
    }
    return forward(operation);
});
```

### 2. Manejo de Errores (`errorLink`)

Detecta errores de tipo `UNAUTHENTICATED` (401) provenientes del servidor. Si ocurre un error de sesión, invoca automáticamente `authService.logout()` para limpiar el estado local y redirigir al usuario.

---

## Flujo de Login con Google

1.  **Obtención de Código**: El frontend obtiene un `code` y un `codeVerifier` de Google.
2.  **Mutación `loginWithGoogle`**: Se envía a la API, la cual:
    - Intercambia el código por tokens.
    - Obtiene la información del usuario (`email`, `name`, `picture`, `googleId`).
    - Crea o actualiza el registro en MongoDB.
    - Retorna un `access_token` local y el objeto `user` completo.
3.  **Persistencia**: El frontend guarda el token en `localStorage` y actualiza los `signals` de `AuthService`.

## Persistencia con F5 (`AuthInitializer`)

Para evitar parpadeos y validar la sesión al recargar la página, se utiliza un `APP_INITIALIZER`:

- Si existe un token en `localStorage`, ejecuta la query `me()` antes de que la aplicación termine de cargar.
- Si el token es inválido o ha expirado, limpia la sesión proactivamente.

---

## Consideraciones Técnicas

- **Frontend**: Usa Angular Signals para un estado reactivo y ligero.
- **Backend**: Usa `@nestjs/config` para una gestión robusta de variables de entorno.
- **Seguridad**: El `JWT_SECRET` debe ser único y complejo en producción. El `googleId` se guarda de forma única en la base de datos para prevenir duplicación de cuentas.
