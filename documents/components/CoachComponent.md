# 🤖 Coach AI — Flow & Architecture

Documentación técnica de la página `/coach`, su jerarquía de componentes, los servicios involucrados, manejo de estado (`CoachState`), almacenamiento en cache (`CoachStorageService`) y cuotas de uso de IA.

---

## 🗺️ Ruta y Acceso

```ts
// src/app/app.routes.ts
{
    path: 'coach',
    loadComponent: () => import('./pages/coach/coach').then((m) => m.Coach),
    canActivate: [authGuard],
}
```

- **Carga lazy** (chunk separado).
- **Protegida** por `authGuard` (sin sesión → redirige a `/auth/login`).
- La página **no redirige internamente**: la navegación ocurre en el facade tras confirmar una acción (ver [Navegación y redirects](#-navegación-y-redirects)).

---

## 🎨 Jerarquía de Componentes

```
Coach (Página / Container)  — src/app/pages/coach/coach.ts
 │
 ├─→ app-info-card                         (tarjeta de presentación del feature)
 ├─→ app-show-user-profile-data            (datos del perfil, SIEMPRE visible)
 ├─→ app-form-user-profile                 (setup básico del perfil si faltan datos) → output (completed)
 ├─→ app-list-plan-training                (historial de planes generados con IA)   → output (viewPlan)
 │     └─→ app-numeric-pagination
 │
 ├─→ app-coach-generate-plan               (formulario de prompt + cuota IA diaria) [cuando NO hay plan activo]
 │
 └─→ app-coach-manage-with-plan            (visualización, modificación, borrado y confirmación) [cuando HAY plan activo]
       ├─→ Botón "Crear otro plan"         (limpia el plan activo y el cache)
       ├─→ CoachNavigatorWeek              (navegador de 7 días)
       ├─→ CoachShowWorkout                (detalle del workout del día seleccionado)
       ├─→ Formulario de modificaciones    (mínimo 10 palabras)
       ├─→ Botones Acción                  (Borrar / Confirmar / Modificar)
       └─→ app-dialog                      (modal de confirmación: Empezar semana / Guardar rutina / Adaptar semana)
```

---

## 🧭 Flujo General y Estado

### 1. `CoachState` (`src/app/core/services/coach/coach.state.ts`)

Gestiona el estado reactivo del plan activo y la persistencia en el cache local del usuario:

- `activePlan`: señal con el `TrainingPlanDetail | null` actual.
- `loadCachedPlan(userId)`: recupera el plan guardado en `CoachStorageService`.
- `setPlan(plan, persist)`: asigna el plan activo y lo guarda en `localStorage` bajo `coach_generated_plan:${userId}`.
- `clearPlan()`: limpia el plan activo y remueve la entrada del cache local.

### 2. `CoachStorageService` (`src/app/core/services/coach/storage/coach.storage.ts`)

- Provee almacenamiento aislado por usuario en `localStorage`.
- Métodos: `getGeneratedPlan(userId)`, `setGeneratedPlan(plan, userId)`, `removeGeneratedPlan(userId)`.

### 3. Máquina de estados del perfil (`coachStep`)

```ts
coachStep = computed<'loading' | 'setup' | 'ready'>(() => {
    if (this.profileUserService.savingSetup()) return 'setup';
    if (this.setupCompletedHold()) return 'setup';
    if (this.profileUserService.loading()) return 'loading';
    return this.missingFields().length === 0 ? 'ready' : 'setup';
});
```

| Estado   | Qué se muestra                                              |
| -------- | ----------------------------------------------------------- |
| loading  | Spinner "Cargando tu perfil..."                             |
| setup    | Formulario `app-form-user-profile` + lista de campos faltantes |
| ready    | Información de perfil + `app-list-plan-training` + (Gestión de plan activo O Creación de plan) |

> **Importante:** La información personal del usuario (`app-show-user-profile-data`) **permanece visible** tanto al ver/modificar un plan existente como al crear uno nuevo.

---

## 🧩 Componentes uno por uno

### 1. `Coach` (Página) — `src/app/pages/coach/coach.ts`
- Contenedor principal que inyecta `CoachState`, `CoachService`, `UserProfileService` y `AuthService`.
- Al seleccionar un plan del historial (`onViewPlan(id)`), consulta los detalles vía `CoachService.getPlanTrainingById(id)` y lo asigna a `CoachState.setPlan()`, mostrándolo inmediatamente en `CoachManageWithPlan`.
- Coordina las notificaciones toast y recarga la lista de planes tras crear, modificar o eliminar.

### 2. `CoachGeneratePlan` — `src/app/shared/components/widgets/coach/generate-plan/`
- Solo se renderiza cuando **no hay un plan activo**.
- Muestra el indicador de cuota diaria de IA (`GET_AI_USAGE_STATUS`):
  - Generaciones usadas vs límite diario (`used / limit`).
  - Barra de progreso visual con colores dinámicos (normal, warning si faltan ≤3, error si se agotó).
  - Fecha/hora de reinicio (00:00 UTC).
- Contiene el `textarea` para el comentario inicial y el botón de generación.
- Al generar con éxito, actualiza `CoachState.setPlan(data)`, pasando automáticamente a la vista de gestión.

### 3. `CoachManageWithPlan` — `src/app/shared/components/widgets/coach/coach-manage-with-plan/`
- Renderiza el plan activo (sea recién generado, cargado desde el cache o seleccionado del historial).
- **Botón "Crear otro plan":** en la parte superior, limpia el plan del estado y del cache local para permitir generar uno nuevo.
- **Navegación y visualización:** `CoachNavigatorWeek` y `CoachShowWorkout`.
- **Modificaciones:** `textarea` que requiere al menos 10 palabras y botón "Modificar", que reenvía las modificaciones a la IA y actualiza el plan activo.
- **Borrado:** botón "Borrar" que elimina el plan del backend y limpia el cache/estado.
- **Confirmación:** botón "Confirmar" que abre `app-dialog` con las 3 opciones soportadas.

### 4. `ListPlanTraining` — `src/app/shared/components/widgets/coach/plan-training/list-plan-training/`
- Historial paginado de planes con IA (`pageSize = 5`).
- Al hacer clic en "Ver completo", emite `viewPlan(id)` al contenedor `Coach`.
- Incluye método `reload()` para refrescar la lista tras mutaciones.

---

## 🔀 Navegación y Redirects

Toda la redirección se concentra en `CoachManageWithPlanFacade.confirmPlan()`:

| Acción             | Navegación                                       |
| ------------------ | ------------------------------------------------ |
| `CREATE_WEEK_LOG`  | `reloadTracking()` → `router.navigate(['/my-week'])` |
| `CREATE_ROUTINE_PLAN` | `router.navigate(['/routines/show', routinePlanId])` |
| `ADAPT_ACTIVE_WEEK` | Muestra estado o mensaje descriptivo si aún no está disponible |

---

## 🏗️ Servicios

| Servicio | Tipo | Archivo | Responsabilidad |
| -------- | ---- | ------- | --------------- |
| `CoachState` | State | `core/services/coach/coach.state.ts` | Estado reactivo del plan activo y sincronización con cache |
| `CoachStorageService` | Storage | `core/services/coach/storage/coach.storage.ts` | Almacenamiento en `localStorage` por `userId` |
| `CoachService` | API + Service | `core/services/coach/coach.service.ts` | Queries/Mutaciones GraphQL (generar, listar, obtener, borrar, confirmar, cuota IA) |