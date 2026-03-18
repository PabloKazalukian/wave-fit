# Autenticación y Apollo en Wave-fit

Este documento detalla el funcionamiento del sistema de autenticación de Wave-fit, la integración con Apollo Client en Angular y el manejo de la sesión mediante cookies seguras.

---

## Arquitectura de Autenticación

### Servicios

```
auth/
├── auth.service.ts           # Servicio principal de autenticación
├── token.storage.ts           # Almacenamiento de token de sesión
└── credentials.service.ts    # Manejo de credenciales guardadas
```

---

## AuthService

Gestiona la autenticación del usuario (Google OAuth y email/password).

### Estado

- `user`: Signal con los datos del usuario actual
- `isAuthenticated`: Computed signal que indica si hay sesión activa
- `user$`: Observable del ID del usuario

### Métodos

| Método                                | Descripción                                                       |
| ------------------------------------- | ----------------------------------------------------------------- |
| `login(identifier, password)`         | Login con email/password                                          |
| `me()`                                | Obtiene usuario actual desde cookie (para recuperación de sesión) |
| `logout()`                            | Cierra sesión y limpia estado                                     |
| `register(name, email, password)`     | Registro de nuevo usuario                                         |
| `isEmailAvailable(email)`             | Verifica si el email está disponible                              |
| `loginWithGoogle(code, codeVerifier)` | Login con OAuth2 de Google                                        |
| `hasSession()`                        | Verifica si hay sesión activa                                     |
| `clearSession()`                      | Limpia sesión local                                               |

---

## TokenStorage

Maneja el almacenamiento local de datos del usuario (no del token JWT, ese va en cookie).

### Métodos

| Método          | Descripción                     |
| --------------- | ------------------------------- |
| `getUser()`     | Obtiene usuario de localStorage |
| `setUser(user)` | Guarda usuario en localStorage  |
| `clear()`       | Limpia todos los datos          |

---

## CredentialsService

Maneja el almacenamiento de credenciales para "recordarme" en el login.

### Métodos

| Método                         | Descripción                                                 |
| ------------------------------ | ----------------------------------------------------------- |
| `getCredentials()`             | Obtiene credenciales guardadas (identificador y contraseña) |
| `saveCredentials(credentials)` | Guarda credenciales encriptadas                             |
| `removeCredentials()`          | Elimina credenciales guardadas                              |

### Seguridad

Las credenciales se almacenan **encriptadas** en localStorage usando `encrypt/decrypt` de `encryption.util`.

> **Nota:** Esta es una práctica de UX para recordar credenciales. El JWT real se maneja mediante cookies HttpOnly.

---

## Seguridad de Tokens

A diferencia de versiones anteriores, el JWT (JSON Web Token) **no se almacena en `localStorage`**. En su lugar:

1. El servidor emite una cookie llamada `token`
2. La cookie tiene el flag `HttpOnly`, lo que impide que cualquier script de JavaScript acceda al token
3. En producción, la cookie tiene el flag `Secure` (solo HTTPS) y `SameSite: None` para permitir peticiones cross-origin seguras

### Backend (NestJS)

- **`GqlAuthGuard`**: Protege los resolvers. Valida la sesión extrayendo el JWT directamente de las cookies
- **`JwtStrategy`**: Configurada para extraer el token desde `request.cookies['token']`
- **`AuthModule`**: Centraliza la configuración de JWT y las estrategias de validación

---

## Integración Apollo

### 1. Sin Interceptores de Token

Se ha eliminado el `authLink`. Ya no es necesario adjuntar manualmente el encabezado `Authorization: Bearer ...` en cada petición.

### 2. Credenciales en Peticiones (`withCredentials`)

Para que el navegador envíe automáticamente las cookies en las peticiones de GraphQL:

```typescript
const http = httpLink.create({
    uri: environment.graphqlUri,
    withCredentials: true,
});
```

### 3. Manejo de Errores (`errorLink`)

Detecta errores de tipo `UNAUTHENTICATED`. Si el servidor retorna un 401, el `errorLink` ejecuta `authService.logout()` para limpiar el estado.

---

## Flujo de Login con Google

1. **Obtención de Código**: El frontend gestiona el flujo OAuth2 con Google y obtiene un `code`
2. **Mutación `loginWithGoogle`**: Se envía a la API con `codeVerifier` para PKCE
3. **Respuesta del Servidor**:
    - La API valida el código con Google
    - Genera un JWT local
    - Envía el JWT en una cabecera `Set-Cookie`
    - Retorna el objeto `user`
4. **Estado Local**: `AuthService` guarda los datos del usuario en `TokenStorage`

---

## Flujo de Login con Email/Password

1. Usuario ingresa credenciales y marca "Recordarme"
2. `AuthService.login()` envía mutación al backend
3. Backend valida y establece cookie HttpOnly
4. `CredentialsService.saveCredentials()` encripta y guarda si "Recordarme" está activado
5. En próximas visitas, las credenciales se recuperan automáticamente

---

## Persistencia con F5 (`AuthInitializer`)

Al recargar la página, el `APP_INITIALIZER` intenta recuperar la sesión:

1. Ejecuta la query `me()`. El navegador envía la cookie `token` automáticamente
2. Si la cookie es válida, el backend retorna los datos del usuario
3. `AuthService.me()` actualiza `user` signal y `TokenStorage`
4. Si falla, se limpian los datos locales

---

## Consideraciones Técnicas

| Aspecto        | Detalle                                                               |
| -------------- | --------------------------------------------------------------------- |
| **Seguridad**  | Cookies HttpOnly mitigan riesgos de XSS                               |
| **Desarrollo** | En desarrollo, cookies usan `SameSite: Lax` para facilitar peticiones |
| **Timeout**    | `me()` tiene timeout de 5 segundos                                    |
| **UI State**   | Se mantiene con signals y computed para reactividad                   |

---

## Archivos Relacionados

```
src/app/core/services/auth/
├── auth.service.ts           # Autenticación principal
├── token.storage.ts          # Almacenamiento de sesión
└── credentials.service.ts    # Credenciales recordadas

src/app/core/services/user/
└── user.service.ts           # Consulta de usuarios
```
