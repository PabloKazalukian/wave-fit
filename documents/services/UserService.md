# 👤 UserService

Documentación del servicio de usuario.

---

## 🏗️ Arquitectura

UserService es un servicio simple **API + Service** integrado:

```
user.service.ts  # Service + Apollo
```

### ¿Por qué no separar?

El servicio de usuario es mínimo y solo tiene una query simple para listar usuarios.

---

## 📁 Archivo

```
src/app/core/services/user/
└── user.service.ts
```

---

## API Pública

### Métodos

| Método          | Descripción                                           |
| --------------- | ----------------------------------------------------- |
| `getAllUsers()` | Obtiene todos los usuarios del sistema (para admins). |

---

## Notas

- No tiene caché local
- No tiene estado reactivo
- Es un servicio simple de consulta

---

## Queries GraphQL

```graphql
query GetAllUser {
    users {
        id
        name
        email
    }
}
```

---

## Interfaces

```typescript
interface User {
    id: string;
    name: string;
    email: string;
}
```

---

## Relación con AuthService

El `AuthService` (en `auth/auth.service.ts`) maneja la autenticación y el usuario actual de la sesión. UserService es para consultar otros usuarios del sistema.
