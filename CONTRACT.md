# WaveFit - Contract (Único de Verdad)

## 1. Interfaces - Template (Creación de Rutinas)

```typescript
interface Exercise {
  id?: string;
  name: string;
  description?: string;
  category: ExerciseCategory;
  usesWeight: boolean;
}

interface RoutineDay {
  id: string;
  title: string;
  type?: ExerciseCategory[];
  exercises?: Exercise[];
  kind: 'WORKOUT' | 'REST';
}

interface RoutinePlan {
  id?: string;
  name: string;
  description: string;
  weekly_distribution: string;
  routineDays: RoutineDay[];
}
```

---

## 2. Interfaces - Tracking (Seguimiento)

> Archivo: `shared/interfaces/tracking.interface.ts` (+ `shared/interfaces/api/tracking-api.interface.ts`)
> **Fechas:** siempre `LocalDate` ("yyyy-MM-dd") en los VM, **nunca** `Date`. La API devuelve ISO de Mongo y los wrappers la convierten con la TZ del usuario.

```typescript
type LocalDate = string; // "yyyy-MM-dd"
type DayStatusVM = 'pending' | 'complete' | 'skipped';

type StatusWorkoutSession = 'not_started' | 'complete' | 'rest' | 'edited';
enum StatusWorkoutSessionEnum {
    NOT_STARTED = 'not_started',
    REST = 'rest',
    COMPLETE = 'complete',
    EDITED = 'edited',
}

interface TrackingVM {
    id: string;
    userId: string;
    startDate: LocalDate;
    endDate: LocalDate;
    workouts?: WorkoutSessionVM[];   // ← la rama de workouts (no `days`)
    planId?: string | null;
    notes?: string;
    completed: boolean;
}

interface TrackingVMS {              // variante con `days` (WeekLog)
    id: string;
    userId: string;
    startDate: LocalDate;
    endDate: LocalDate;
    planId?: string | null;
    days: WeekLogDayVM[];
    completed: boolean;
    notes?: string;
    workouts?: WorkoutSessionVM[];
    extras?: string[];
}

interface WeekLogDayVM {
    order: number;
    date: LocalDate;
    isRest: boolean;
    workoutSessionId?: string | null;
    exercises: ExercisePerformanceVM[];
    extraSessionIds: string[];
    status: DayStatusVM;
}

interface WorkoutSessionVM {
    id?: string;
    date: LocalDate;
    exercises: ExercisePerformanceVM[];
    extras?: string[];
    status: StatusWorkoutSession;
    notes?: string;
    planId?: string;
}

interface ExercisePerformanceVM {
    exerciseId: string;
    name: string;
    series: number;
    category: ExerciseCategory;
    sets: { reps: number; weights?: number }[];
    usesWeight: boolean;
    notes?: string;
}
```

> ⚠️ `ExtraActivityVM` quedó deprecada; las actividades extra usan `ExtraSession` (sección 3).

---

## 3. Interfaces - ExtraSession

> Archivo: `shared/interfaces/extra-session.interface.ts`

```typescript
enum ExtraSessionCategory {
    CARDIO = 'CARDIO',
    STRENGTH = 'STRENGTH',
    SPORT = 'SPORT',
    MIND_BODY = 'MIND_BODY',
}

interface ExtraSessionDisciplineConfig {
    key: string;
    label: string;
    category: ExtraSessionCategory;
    met: number; // para estimar calorías
}

interface ExtraSession {
    id: string;
    userId: string;
    workoutSessionId: string;
    category: ExtraSessionCategory;
    discipline: string;
    date: string | Date;
    duration: number;
    intensityLevel: number;
    calories?: number;
    notes?: string;
}

interface CreateExtraSessionForm {
    date: string;
    discipline: string;
    duration: number;
    intensityLevel: number;
    calories?: number;
    notes?: string;
}

interface UpdateExtraSessionInput {
    id: string;
    discipline?: string;
    date?: string;
    duration?: number;
    intensityLevel?: number;
    calories?: number;
    notes?: string;
}

interface CreateExtraSessionContext {
    weekLogId: string;
    dayOrder: number; // 1-7
    extraSession: CreateExtraSessionForm;
}

interface UpdateWeekLogExtraSessionInput {
    id: string;
    days: {
        order: number;
        extraSession: {
            workoutSessionId: string;
            date: string;
            discipline: string;
            duration: number;
            intensityLevel: number;
            calories?: number;
            notes?: string;
        };
    }[];
}
```

---

## 4. Interfaces - UserProfile

> ⚠️ `shared/interfaces/user-profile.interface.ts` está **vacío**. Los tipos reales viven en `shared/utils/profile.types.ts`.

```typescript
type Gender = 'M' | 'F' | 'other';
type UnitsPreference = 'metric' | 'imperial';
type DistributionDays = 'Week-log' | 'Day-log';
type PrimaryGoal = 'fat_loss' | 'muscle_gain' | 'strength' | 'endurance' | 'maintenance' | 'recomp';
type TrainingExperience = 'beginner' | 'intermediate' | 'advanced' | 'athlete';

interface ProfileUser {              // shape de dominio (PostWrapper)
    id: string;
    userId: string;
    gender: Gender;
    birthDate: string;
    heightCm: number;
    weightKg: number;                // usado por weekly-stats para calorías
    bodyFatPct?: number;
    distributionDays: DistributionDays;
    unitsPreference: UnitsPreference;
    createdAt: string;
    updatedAt: string;
    goal?: Goal | null;
    healthConstraints?: HealthConstraint | null;
    schedule?: Schedule | null;
    trainingPreferences?: TrainingPreference | null;
    resources?: Resource | null;
    strengthMetrics: StrengthMetric[];
    weightLogs: WeightLog[];
}

type UpdateProfileInput = Partial<{
    gender: Gender;
    birthDate: string;
    heightCm: number;
    weightKg: number;
    bodyFatPct: number;
    distributionDays: DistributionDays;
    unitsPreference: UnitsPreference;
}>;
```

> API: `ProfileUserAPI`, `GoalAPI`, `HealthConstraintAPI`, `ScheduleAPI`, `TrainingPreferenceAPI`, `ResourceAPI`, `StrengthMetricAPI`, `WeightLogAPI`, `UserProfileContextAPI` (todos en `profile.types.ts`).

---

## 5. Interfaces - Coach / AI-Plan

> Archivos: `shared/interfaces/coach.interface.ts`, `shared/interfaces/ai-plan.interface.ts`

```typescript
type AiPlanFocus =
    | 'hypertrophy' | 'strength' | 'endurance' | 'fat_loss'
    | 'maintenance' | 'recomp' | 'sport_specific';

interface AiPlanExercise {
    exerciseId: string;
    name: string;
    plannedSets: number;
    plannedReps: string;
    rpe?: number | null;
    restSeconds?: number | null;
    notes?: string | null;
}

interface AiPlanDay {
    order: number;
    isRest: boolean;
    focus: string | null;
    exercises: AiPlanExercise[];
}

interface AiPlanResponse {
    title: string;
    focus: AiPlanFocus;
    durationWeeks: number;
    daysPerWeek: number;
    days: AiPlanDay[]; // days en la raíz
}

interface TrainingPlanListItem {
    id: string;
    title: string;
    focus: string;
    status: string;
    durationWeeks?: number;
    trainingDaysPerWeek?: number;
    confirmed?: boolean;
    createdAt: string;
}

interface TrainingPlanDetail {
    id: string;
    title: string;
    description: string | null;
    focus: string;
    status: string;
    startDate: string;
    endDate: string;
    durationWeeks: number;
    trainingDaysPerWeek: number;
    tags: string[];
    aiSnapshot: AiSnapshot;
}
```

---

## 6. Interfaces - Auth / Token

> Archivos: `shared/interfaces/token.interface.ts`, `shared/interfaces/auth.interface.ts`

```typescript
interface Token {
    access_token: string;
    userId: string;
}

interface User {
    id: string;
    name: string;
    email: string;
    avatar: { url: string } | null;
    role: string;
}

interface LoginWithGoogle {
    access_token: string;
    user: User;
    __typename: string;
}
```

---

## 7. Enums

```typescript
enum ExerciseCategory {
    CHEST = 'chest',
    BACK = 'back',
    LEGS = 'legs',
    LEGS_FRONT = 'legs_front',
    LEGS_POSTERIOR = 'legs_posterior',
    BICEPS = 'biceps',
    TRICEPS = 'triceps',
    SHOULDERS = 'shoulders',
    CORE = 'core',
    CARDIO = 'cardio',
}

enum StatusWorkoutSessionEnum {
    NOT_STARTED = 'not_started',
    REST = 'rest',
    COMPLETE = 'complete',
    EDITED = 'edited',
}

enum ExtraSessionCategory {
    CARDIO = 'CARDIO',
    STRENGTH = 'STRENGTH',
    SPORT = 'SPORT',
    MIND_BODY = 'MIND_BODY',
}
```

> ⚠️ **Bug conocido:** la API devuelve `category` en MAYÚSCULAS (`CHEST`) mientras el enum es minúscula (`chest`). Normalizar con `toLowerCase()` al consumir (ver `weekly-stats.ts`).

---

## 8. Convenciones de Nomenclatura

| Sufijo | Significado | Ejemplo |
|--------|-------------|---------|
| **VM** | ViewModel - interfaz orientada a UI | `RoutineDayVM` tiene `expanded: boolean` |
| **API** | Respuesta cruda del backend | `RoutineDayAPI` |
| **SEND** | Datos a enviar al backend | `RoutineDayCreateSend` |
| **Create** | Datos para crear nueva entidad | `RoutinePlanCreate` |
| **Wrapper** | Transforma datos entre capas | `wrapperRoutineDayAPItoRoutineDayVM()` |

---

## 9. Convenciones de HTML Semántico

Los templates `.html` deben priorizar etiquetas semánticas sobre `div` genéricos. Referencia de buenas prácticas: `src/app/pages/auth/callback/callback.html`.

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
1. **Solo `<div>` para layouts puros** (grid/flex que no aportan semántica).
2. Respetar la **jerarquía de encabezados**.
3. **Filas label/value → `<ul>` con `<li>`**.
4. Usar `aria-label`/`aria-labelledby` en secciones, navegaciones y controles sin texto visible.

---

## 10. Wrappers

| Wrapper | Función |
|---------|---------|
| `exercises.wrapper.ts` | `wrapperExerciseAPItoVM()`: Exercise[] → ExercisePerformanceVM[] |
| `routines.wrapper.ts` | `wrapperRoutineDayAPItoRoutineDay()` / `wrapperRoutineDayAPItoRoutineDayVM()` / `wrapperRoutineDayCreateToPayload()` |
| `tracking.wrapper.ts` | `wrapperTrackingApiToVM()` / `wrapperTrackingApiToVMS()` (ISO → LocalDate), `wrapperWeekLogDayApiToVM()`, `wrapperWorkoutSessionApiToVM()`, `wrapperExercisePerformance*()`, `wrapperWorkoutSessionVMToApi()` |
| `plans.wrapper.ts` | `wrapperRoutinePlanVMtoRoutinePlan()` |
| `extra-session.wrapper.ts` | `mapToUpdateWeekLogExtraSessionInput()`: CreateExtraSessionContext → UpdateWeekLogExtraSessionInput |
| `profile.wrapper.ts` | `wrapperProfileUserToDomain()` / `wrapperProfileContextToDomain()` + sub-wrappers (Goal, Schedule, Resource, ...) |
| `workout.wrapper.ts` | ⚠️ vacío (placeholder, no usar) |
| `utils/ai-plan.adapter.ts` | `AiPlanResponse` → `WorkoutSessionVM`/`TrackingVM` (infiere `ExerciseCategory` por keywords) |
