# WaveFit - Guía para Agentes IA

## 1. Proyecto

- **Frontend:** Angular 20 + TypeScript + TailwindCSS + Apollo GraphQL
- **Backend:** NestJS + GraphQL + MongoDB (otro repositorio)
- **Auth:** Google OAuth (PKCE) + email/password
- **Demo:** https://wave-fit.vercel.app/

---

## 2. Propósito

- Crear ejercicios personalizados
- Crear rutinas diarias (RoutineDay) con ejercicios
- Crear planes semanales (RoutinePlan) combinando rutinas diarias
- Hacer seguimiento (Tracking) de cada semana con series, pesos y reps

---

## 3. Arquitectura de Componentes

### Flujo de datos
```
Dumb Components → Facade → Domain Service → (API/Storage Services + State Service)
```

### Capas

| Capa | Responsabilidad | Ejemplo |
|------|-----------------|---------|
| **Dumb Components** | Solo renderizado, sin lógica | `Button`, `Card` |
| **Facade** | Coordina la vista, consume domain services | `RoutineFacade` |
| **Domain Service** | Lógica de negocio, orquestación | `TrackingDomainService`, `RoutineDomainService` |
| **API/Storage Services** | Cache con BehaviorSubject, llamadas HTTP | `ExerciseService` |
| **State Service** | Estado reactivo del elemento activo (día/workout) | `WorkoutStateService`, `RoutineCreationStateService` |

---

## 4. Estructura de Carpetas

```
src/app/
├── core/
│   ├── apollo/               # Queries GraphQL (coach, exercises, plans, tracking, ...)
│   ├── auth/                 # TokenStorage, auth.initializer
│   ├── services/             # Todos los servicios (ver §8)
│   └── auth-guard.ts
├── pages/                     # Vistas (lazy-loaded)
│   ├── auth/                 # login, register, callback
│   ├── coach/                # Coach IA
│   ├── home/                 # Dashboard
│   ├── exercises/
│   ├── my-week/              # + success/
│   ├── plans/                # + create/
│   ├── routines/             # + show/
│   ├── trackings/            # lista, stats/, show/:id
│   └── user/                 # + profile/
├── shared/
│   ├── animations/
│   ├── components/           # Dumb components (widgets)
│   ├── interfaces/           # *.interface.ts, api/*.api.ts, input*.ts
│   ├── pipes/
│   ├── utils/
│   ├── validators/
│   └── wrappers/             # Transformadores
├── app.routes.ts
└── app.config.ts
```

---

## 5. Modelo de Datos: Dos Ramas

| Rama | Contenedor | Elemento Activo (State) |
|------|------------|------------------------|
| **TEMPLATE** | RoutinePlan | RoutineDay |
| **TRACKING** | Tracking | WorkoutSession |

---

## 6. Convenciones

- **Componentes:** Standalone (Angular 20, sin NgModules)
- **CSS:** TailwindCSS (paleta, spacing y patrones en [`documents/design/UI-Conventions.md`](documents/design/UI-Conventions.md))
- **HTML semántico:** Priorizar etiquetas semánticas sobre `div` genéricos (ver §6.1)
- **Naming:**
  - Archivos: `kebab-case.ts`, `kebab-case.html`
  - Clases: `PascalCase`
  - Interfaces: `*.interface.ts`
- **Prettier:** printWidth: 100, singleQuote: true

### 6.1 HTML Semántico (OBLIGATORIO)

Los templates `.html` deben usar etiquetas semánticas en vez de `div` a secas. Referencia de buenas prácticas: `src/app/pages/auth/callback/callback.html`.

| Etiqueta | Uso |
|----------|-----|
| `<section>` | Bloque temático autocontenido (un widget, una tarjeta de contenido) |
| `<header>` | Cabecera de un bloque/sección (título + acciones) |
| `<footer>` | Pie de un bloque/sección (información complementaria) |
| `<nav>` | Navegación (paginación, dots de carrusel, menús) |
| `<h1>`–`<h6>` | Títulos respetando la jerarquía (h2 > h3 > h4...) |
| `<ul>`/`<ol>` + `<li>` | Listas de datos (nunca `div` repetidos para filas) |
| `<p>` | Párrafos de texto |
| `<a>` | Enlaces |
| `<button>` | Acciones clicables (tipo botón) |
| `<aside>` | Contenido complementario |
| `<figure>`/`<figcaption>` | Ilustraciones con pie |

Reglas:
1. **Solo `<div>` para layouts puros** (grid/flex que no aportan semántica). Si el contenido es una lista, un título, una navegación o un texto → usar la etiqueta adecuada.
2. Respetar la **jerarquía de encabezados** (no saltar de h2 a h4 sin h3, no usar h1 repetido en widgets).
3. **Listas de filas label/value → `<ul>` con `<li>`**, no un `<div>` por fila.
4. Usar `aria-label`/`aria-labelledby` en secciones, navegaciones y controles sin texto visible.

---

## 7. GraphQL

- Cliente: Apollo Angular
- Consultas/Mutaciones: Inline con `gql`
- Errores: `handleGraphqlError` en `shared/utils/`

---

## 8. Arquitectura de Servicios

| Complejidad | Patrón | Servicios |
|-------------|--------|-----------|
| **Alta** | Domain + (API \| Storage) + State | PlanTracking |
| **Media** | Domain + API + State | UserProfile |
| **Media** | API + Storage + State | Plans, ExtraSession |
| **Baja** | API + Service (juntos) | Exercises, Routines, Auth, Coach |
| **Estado** | State + API | Workouts |
| **Infra** | Soporte (offline, red, utilidades) | Network, Sync, Storage, Date, Warmup |

### Estructura de Services
```
core/services/
├── trackings/              # Alta: Domain + API + Storage + State
│   ├── plan-tracking.service.ts           # Fachada
│   ├── plan-tracking.domain.ts            # Lógica de negocio
│   ├── plan-tracking.state.ts             # Estado reactivo
│   ├── tracking-list.state.ts             # Estado lista de trackings
│   └── plan-tracking/
│       ├── api/plan-tranking.api.ts       # (nota: "tranking" en el nombre del repo)
│       └── storage/plan-tracking.storage.ts
├── plans/                  # Media: API + Storage + State
│   ├── plans.service.ts
│   ├── day-plan-state.service.ts
│   ├── api/plans.api.ts
│   └── storage/plans.storage.ts
├── extra-session/          # Media: API + Storage (estado en WorkoutState)
│   ├── extra-session.service.ts
│   └── api/extra-session.api.ts
├── user/                   # UserProfile: Domain + API + State
│   ├── user-profile.service.ts
│   ├── user-profile.domain.ts
│   ├── user-profile.state.ts
│   └── api/
│       ├── user-profile-api.service.ts
│       ├── user-profile-api.get.service.ts
│       └── user-profile-api.set.service.ts
├── routines/               # Baja: API + Service
│   ├── routines.service.ts
│   └── api/routines.api.ts
├── exercises/              # Baja: API + Service
│   └── exercises.service.ts
├── auth/                   # Baja: API + Service (TokenStorage en core/auth/)
│   ├── auth.service.ts
│   └── credentials.service.ts
├── coach/                  # Baja: API + Service
│   └── coach.service.ts
├── workouts/               # Estado + API
│   ├── workout.state.ts
│   └── api/workout.api.ts
├── network/                # network-status.service.ts
├── sync/                   # sync-queue.service.ts, sync.types.ts (offline)
├── storage/                # indexed-db.service.ts
├── date.service.ts
└── warmup.service.ts
```

---

## 9. Estado y Patrones

- **Signals:** `user = signal<any | null>(null)`
- **RxJS:** BehaviorSubject para cache de services

---

## 10. Rutas

```
/home                    -> Dashboard (protegido)
/coach                   -> Coach IA (protegido)
/auth/*                  -> Público (login, register, callback)
/exercises               -> Biblioteca ejercicios (protegido)
/my-week                 -> Entrenamiento del día + /success (protegido)
/plans                   -> Planes + /create (protegido)
/routines/show/:id       -> Ver rutina (protegido)
/user                    -> Perfil usuario (protegido)
/user/profile            -> Editar perfil (protegido)
/user/trackings          -> Lista + stats + show/:id (protegido)
```

Todas excepto `/auth` requieren `authGuard`.

---

## 11. Comandos

```bash
npm start        # Desarrollo http://localhost:4200
npm run build    # Build producción
npm run lint     # ESLint
npm run format   # Prettier
```

---

## 12. Documentos de Referencia

| Escenario | Archivo |
|-----------|---------|
| Interfaces, Enums, Wrappers, Naming | `CONTRACT.md` |
| Tracking: componentes y servicios | `documents/components/MyWeekComponent.md` |
| Rutinas: componentes y servicios | `documents/components/RoutinePlanComponent.md` |
| Índice de componentes | `documents/components/index.md` |
| Índice de servicios | `documents/services/index.md` |
| Auth y Apollo | `documents/services/AuthenticationAndApollo.md` |
| ExercisesService | `documents/services/ExercisesService.md` |
| RoutinesService | `documents/services/RoutinesService.md` |
| UserService | `documents/services/UserService.md` |
| UserProfileService | `documents/services/UserProfileService.md` |
| PlanTrackingService | `documents/services/PlanTrackingService.md` |
| ExtraSessionService | `documents/services/ExtraSessionService.md` |
| WorkoutStateService | `documents/services/WorkoutStateService.md` |
| Guía de estilo / UI (colores por acción, spacing, tipografía, botones) | `documents/design/UI-Conventions.md` |

> **Importante:** Antes de modificar código de tracking o rutinas, leer el documento de componentes correspondiente.

> **Importante:** Antes de crear/modificar templates o revisar cambios de UI, consultar [`documents/design/UI-Conventions.md`](documents/design/UI-Conventions.md) (colores por acción, spacing, tipografía, botones) y AGENTS §6.1.
