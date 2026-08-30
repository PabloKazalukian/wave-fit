# Autenticación y Apollo en Wave-fit

Este documento detalla el funcionamiento del sistema de autenticación de Wave-fit, la integración con Apollo Client en Angular y el manejo de la sesión mediante cookies seguras.

---

## Arquitectura de Autenticación

### Servicios

```
src/app/core/
├── auth/
│   ├── auth.initializer.ts    # APP_INITIALIZER (restaura sesión al recargar)
│   └── token.storage.ts       # Almacenamiento del usuario en IndexedDB (Dexie)
└── services/auth/
    ├── auth.service.ts        # Servicio principal de autenticación
    └── credentials.service.ts # "Recordarme" en el login (encriptado)
```

> **Ubicación de TokenStorage:** está en `src/app/core/auth/token.storage.ts`, NO en `services/auth/`.

---

## AuthService

Gestiona la autenticación del usuario (Google OAuth y email/password).

### Estado

- `user`: Signal con los datos del usuario actual
- `avatarUrl`: Computed → `user()?.avatar?.url`
- `isAuthenticated`: Computed signal (`user() !== null`)
- `isAuthenticated$`: BehaviorSubject observable
- `user$`: Observable del ID del usuario

### Métodos

| Método                                | Descripción                                                       |
| ------------------------------------- | ----------------------------------------------------------------- |
| `initializeUserFromStorage()`         | Hidrata `user` desde IndexedDB (async)                            |
| `login(identifier, password)`         | Login con email/password → llama `me()`                           |
| `me()`                                | Obtiene usuario actual (cookie). Timeout **2000ms**. Tolera fallos de red/timeout (mantiene sesión offline salvo error de auth explícito) |
| `logout()`                            | Mutation `logout` + `clearSession()` + redirige a `/auth/login` |
| `register(name, email, password)`     | Registro de nuevo usuario                                          |
| `isEmailAvailable(email)`             | Verifica si el email está disponible                               |
| `updateAvatar(base64Image)`           | Actualiza avatar y persiste en IndexedDB                           |
| `loginWithGoogle(code, codeVerifier)` | Login con OAuth2 de Google                                         |
| `hasSession()`                        | Verifica si hay sesión activa (`user() !== null`)                  |
| `clearSession()`                      | Limpia IndexedDB y el estado (async)                               |

**GQL inline:** las consultas de auth (`Login`, `Me`, `Logout`, `CreateUser`, `IsEmailAvailable`, `LoginWithGoogle`, `UpdateAvatar`) se definen **inline con `gql`** en `auth.service.ts` (no viven en `core/apollo/`).

---

## TokenStorage

Almacena el **usuario** del frontend (no el JWT, ese va en cookie) de forma **asíncrona en IndexedDB (Dexie)** vía `IndexedDbStorageService`, tabla `authUser` con clave `'current'`.

> ⚠️ Ya NO usa `localStorage` síncrono; todos los métodos devuelven `Promise`.

| Método          | Descripción                                            |
| --------------- | ------------------------------------------------------ |
| `getUser()`     | `Promise<User \| null>` desde IndexedDB (tabla authUser) |
| `setUser(user)` | Guarda usuario en IndexedDB (o `clear()` si es null)   |
| `clear()`       | Elimina la entrada `'current'`                          |

---

## CredentialsService

Maneja el almacenamiento de credenciales para "recordarme" en el login. **Sí usa `localStorage`** (a diferencia de TokenStorage).

| Método                         | Descripción                                                 |
| ------------------------------ | ----------------------------------------------------------- |
| `getCredentials()`             | Retorna `{ identifier, password, remember }` (desencripta)  |
| `saveCredentials(credentials)` | Guarda credenciales encriptadas con `encrypt()`             |
| `removeCredentials()`          | Elimina credenciales guardadas                              |

### Seguridad

Las credenciales se almacenan **encriptadas** en localStorage usando `encrypt/decrypt` de `encryption.util`. Es solo una práctica de UX para recordarlas; el JWT real se maneja con cookies HttpOnly.

---

## Seguridad de Tokens

El JWT **no se almacena en `localStorage`**. En su lugar:

1. El servidor emite una cookie llamada `token`
2. La cookie tiene el flag `HttpOnly` (inaccesible desde JS)
3. En producción: `Secure` (solo HTTPS) y `SameSite: None` (cross-origin seguro)

### Backend (NestJS)

- **`GqlAuthGuard`**: protege resolvers; extrae el JWT de las cookies
- **`JwtStrategy`**: extrae el token desde `request.cookies['token']`
- **`AuthModule`**: centraliza la configuración de JWT

---

## Integración Apollo

### 1. Sin Interceptores de Token

Se eliminó el `authLink`; no hace falta adjuntar `Authorization: Bearer ...`.

### 2. Credenciales en Peticiones (`withCredentials`)

```typescript
const http = httpLink.create({
    uri: environment.graphqlUri,
    withCredentials: true,
});
```

### 3. Manejo de Errores (`errorLink`)

En `src/main.ts`, el `errorLink` detecta `UNAUTHENTICATED`/`UNAUTHORIZED`/401 y ejecuta `authService.logout()` + redirección.

---

## Flujo de Login con Google

1. **Obtención de Código**: el frontend gestiona OAuth2 (PKCE) y obtiene un `code`
2. **Mutación `loginWithGoogle`** con `codeVerifier`
3. La API valida, genera JWT local, lo envía vía `Set-Cookie` y retorna `user`
4. `AuthService` guarda el usuario en `TokenStorage` (IndexedDB)

---

## Flujo de Login con Email/Password

1. Usuario ingresa credenciales y marca "Recordarme"
2. `AuthService.login()` → `switchMap` → `me()`
3. **`CredentialsService.saveCredentials()`** se llama desde el **componente `login.ts`** (no dentro de `AuthService.login()`)
4. En próximas visitas, las credenciales se recuperan y precargan el formulario

---

## Persistencia con F5 (`AuthInitializer`)

`provideAuthInitializer()` (en `src/main.ts` / `app.config`) ejecuta al arrancar:

1. Omite las rutas `/auth/login` y `/auth/register`
2. **`initializeUserFromStorage()`** hidrata desde IndexedDB (offline-first)
3. Si hay sesión, intenta `me()` con `timeout(3000)`; si falla (red/timeout) mantiene el estado offline
4. `me()` tiene `timeout(2000)` interno

---

## Consideraciones Técnicas

| Aspecto        | Detalle                                                               |
| -------------- | --------------------------------------------------------------------- |
| **Seguridad**  | Cookies HttpOnly mitigan riesgos de XSS                               |
| **Persistencia** | Usuario en IndexedDB (Dexie); credenciales "recordarme" en localStorage encriptadas |
| **Offline**    | Hydrate desde IndexedDB + tolerancia a errores de red/timeout en `me()` |
| **Timeout**    | `me()` **2000ms**; auth.initializer **3000ms**                        |
| **UI State**   | Signals + computed para reactividad                                   |

---

## Archivos Relacionados

```
src/app/core/auth/
├── auth.initializer.ts      # APP_INITIALIZER
├── token.storage.ts         # Usuario en IndexedDB (async)
└── token.storage.spec.ts

src/app/core/services/auth/
├── auth.service.ts          # Autenticación principal
└── credentials.service.ts   # Credenciales recordadas (localStorage encriptado)
```
