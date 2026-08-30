# 🗓️ Training History — /user/history

Documentación técnica de la página **Historial de Entrenamiento** (`/user/history`), un calendario mensual que muestra el estado de cada día (semana activa, descanso, completo, pendiente).

---

## 🎨 Página y Componentes

```
/user/history → HistoryComponent (src/app/pages/user/history/history.ts)
   └── Calendario mensual generado en la propia página (grid de días)
         ├── Cabecera: mes/año + navegación (prevMonth/nextMonth)
         └── Grid: calendarGrid computed → CalendarDay[]
```

No hay widgets anidados; el calendario vive en la página con `computed` y `effect`.

---

## 🏗️ Arquitectura de Servicios

Patrón **API + Service** (baja complejidad, sin Domain/State):

```
HistoryComponent
  └─→ TrainingHistoryService (API + Service)
        ├── Apollo (GET_TRAINING_CALENDAR)
        └── AuthService (handleGraphqlError)
```

### TrainingHistoryService (`core/services/training-history/training-history.service.ts`)

- `getTrainingCalendar(year, month): Observable<TrainingCalendarResponse>`
  - Construye `TrainingCalendarInput` (`{ year, month: month+1, timezone }`)
  - Query `GET_TRAINING_CALENDAR` con `fetchPolicy: 'network-only'`
  - Mapea a `res.data.trainingCalendar`

> Query en `src/app/core/apollo/training-history.queries.ts`.

---

## 🧩 Flujo de la Página

1. Efecto `calendarEffect` reacciona a `currentYear()`/`currentMonth()` → `loadCalendar(year, month)`.
2. `loadCalendar` llama a `getTrainingCalendar` y setea `calendarDays`.
3. `calendarGrid` (computed) construye la grilla: rellena los días previos/posteriores y marca los del mes.
4. `isToday`, `isWeekLog`, `isComplete`, `isRest`, `isPending`, `isNone` determinan estilos.
5. Navegación `prevMonth()`/`nextMonth()` actualiza mes/año (efecto recarga).

---

## 📊 Modelos (`shared/interfaces/training-history.interface.ts`)

```typescript
enum CalendarDayType { WEEK_LOG = 'WEEK_LOG', DAY_LOG = 'DAY_LOG' }
enum TrainingStatus { PENDING, COMPLETE, SKIPPED, REST, NONE }

interface WeekLogReference {
    id: string; startDate: string; endDate: string;
    completed: boolean; active: boolean; notes?: string;
}

interface CalendarDay {
    date: string;                // "yyyy-MM-dd"
    type: CalendarDayType;
    status: TrainingStatus;
    workoutSessionId?: string;
    extraSessionIds?: string[];
    weekLogReference?: WeekLogReference | null;
}

interface TrainingCalendarResponse {
    year: number; month: number; days: CalendarDay[];
}

interface TrainingCalendarInput {
    year: number; month: number; timezone?: string;
}
```

---

## 📁 Archivos Relacionados

```
src/app/core/services/training-history/
├── training-history.service.ts
└── training-history.spec.ts

src/app/core/apollo/training-history.queries.ts

src/app/pages/user/history/
├── history.ts
├── history.html
└── history.css
```

> Ruta registrada en `src/app/app.routes.ts` → `user` children: `history`.
