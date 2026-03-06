# Autenticación y Apollo en Wave-fit

Este documento detalla el funcionamiento del sistema de autenticación de Wave-fit, la integración con Apollo Client en Angular y el manejo de la sesión mediante cookies seguras.

## Arquitectura de Autenticación

El sistema utiliza **Passport.js** en el backend para manejar estrategias de autenticación, centrando la seguridad en el uso de **HttpOnly Cookies**.

### Seguridad de Tokens

A diferencia de versiones anteriores, el JWT (JSON Web Token) **no se almacena en `localStorage`**. En su lugar:

1. El servidor emite una cookie llamada `token`.
2. La cookie tiene el flag `HttpOnly`, lo que impide que cualquier script de JavaScript (incluyendo ataques XSS) acceda al token.
3. En producción, la cookie tiene el flag `Secure` (solo HTTPS) y `SameSite: None` para permitir peticiones cross-origin seguras.

### Backend (NestJS)

- **`GqlAuthGuard`**: Protege los resolvers. Valida la sesión extrayendo el JWT directamente de las cookies enviadas por el navegador.
- **`JwtStrategy`**: Configurada para extraer el token desde `request.cookies['token']`.
- **`AuthModule`**: Centraliza la configuración de JWT y las estrategias de validación.

---

## Integración Apollo (Frontend)

La configuración de Apollo en `src/main.ts` se ha simplificado al delegar la gestión del token al navegador.

### 1. Sin Interceptores de Token

Se ha eliminado el `authLink`. Ya no es necesario adjuntar manualmente el encabezado `Authorization: Bearer ...` en cada petición.

### 2. Credenciales en Peticiones (`withCredentials`)

Para que el navegador envíe automáticamente las cookies en las peticiones de GraphQL, el `HttpLink` debe estar configurado con `withCredentials: true`:

```typescript
const http = httpLink.create({
    uri: environment.graphqlUri,
    withCredentials: true, // Crucial para el envío de cookies
});
```

### 3. Manejo de Errores (`errorLink`)

Detecta errores de tipo `UNAUTHENTICATED`. Si el servidor retorna un 401 (ej. cookie expirada), el `errorLink` ejecuta `authService.logout()` para limpiar el estado del usuario en el frontend y redirigir al login.

---

## Flujo de Login con Google

1.  **Obtención de Código**: El frontend gestiona el flujo OAuth2 con Google y obtiene un `code`.
2.  **Mutación `loginWithGoogle`**: Se envía a la API.
3.  **Respuesta del Servidor**:
    - La API valida el código con Google.
    - Genera un JWT local.
    - Envía el JWT en una cabecera `Set-Cookie`.
    - Retorna el objeto `user` (sin el token sensible).
4.  **Estado Local**: `AuthService` guarda los datos no sensibles del usuario (`name`, `id`) en `localStorage` para mantener la UI personalizada, pero la identidad real reside en la cookie.

## Persistencia con F5 (`AuthInitializer`)

Al recargar la página, el `APP_INITIALIZER` intenta recuperar la sesión:

- Ejecuta la query `me()`. El navegador envía la cookie `token` automáticamente.
- Si la cookie es válida, el backend retorna los datos del usuario y la aplicación carga con la sesión activa.
- Si falla, se limpian los datos locales de `localStorage`.

---

## Consideraciones Técnicas

- **Signals**: Se utiliza `isAuthenticated` (computed signal) basado en la presencia del objeto `user` cargado.
- **Seguridad**: Al usar cookies `HttpOnly`, hemos mitigado el riesgo de robo de tokens via XSS.
- **Cookies en Desarrollo**: En entorno local, las cookies usan `SameSite: Lax` para facilitar el desarrollo entre puertos distintos (4200 vs 3000).
