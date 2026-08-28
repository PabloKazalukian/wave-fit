# 🎨 UI Conventions — Colores, Spacing y Patrones Visuales

Guía de referencia para crear o modificar interfaces en el frontend. **Antes de tocar cualquier template, consultá esta documentación y el AGENTS.md §6.**

Todo esto fue relevado del código real del repo (Tailwind config + templates), no inventado.

---

## 1. Paleta y Semántica de Color

Hex originales de `tailwind.config.js`. Cada color tiene un **rol de acción** definido. Usarlos fuera de ese rol es considerado un error.

| Color            | Hex       | Rol de acción                                                                 | Ejemplos reales en el repo                              |
| ---------------- | --------- | ----------------------------------------------------------------------------- | ------------------------------------------------------- |
| **primary**      | `#50C878` | CTA principal / marca / acción "seguir adelante" / loadings                     | "Explorar planes", "Continuar", "Guardar" (paso), focus ring global (`styles.css`) |
| **primaryDark**  | `#2B6D41` | Guardar/finalizar definitivo de un flujo                                       | "Guardar" en `workout-edition`, `routine-exercise-form` |
| **primary2/3/Light** | `#66D18A` / `#3CA15E` / `#A1E6BE` | Variantes de texto/fondos suaves del color de marca        | títulos `text-primary2/3`, fondos `bg-primary/10`       |
| **secondary**    | `#4472B4` | Acciones secundarias/informativas, navegación de apoyo, loadings "secundarios" | botones de apoyo en `plans.html`, `tracking-workout`     |
| **accent**       | `#F5C623` | **Destacar una funcionalidad nueva, alternativa o "gratis/extra"**             | tarjeta Coach AI, "Comenzar entrenamiento" (libre), botones de edición de series |
| **confirm**      | `#C83A6E` | Confirmar una decisión importante / pantalla de éxito                          | "Confirmar plan" (`coach-manage-with-plan`), `success.html` |
| **error**        | `#ba1a1a` | **Solo acciones destructivas o con pérdida** (eliminar, borrar, cancelar cambios) o mensajes de error | "Eliminar plan", "Cancelar" en formularios, mensajes de error |
| **success**      | `#4CAF50` | Resultado positivo confirmado (post-guardado exitoso)                          | estados de éxito                                       |
| **warning**      | `#D66F6F` | Advertencias (sin bloqueo)                                                     | avisos                                                |
| **text**         | `#2F2F2F` | Neutral: usar con `variant="ghost"` para "Cancelar" sin jerarquía              | "Cerrar" / "Cancelar" secundarios                      |

### Colores de fondo / contenedores

| Clase                  | Hex       | Uso                                               |
| ---------------------- | --------- | ------------------------------------------------- |
| `bg-background`        | `#121212` | Fondo global de la app                            |
| `bg-background2`       | `#151C17` | **Fondo de tarjetas/bloques** (el más usado)      |
| `bg-background3`       | `#1C2F22` | Fondo interno (headers de notificación, etc.)     |
| `bg-background4`       | `#295538` | Borde/fondo secundario de tarjetas (`border-2 border-background4`) |
| `bg-surface`           | `#2b322c` | Superficies neutrales                             |
| `text-text2`           | `#adadad` | **Texto de párrafo estándar** (el más usado)      |
| `text-white`           | `#ffffff` | Texto sobre fondos coloreados                     |

### Reglas duras de color

- ❌ **NO** usar `error` para una acción que no sea destructiva (ni `primary` para destructivas).
- ❌ **NO** usar `accent` como CTA principal de una página; está reservado para resaltar novedades/alternativas.
- ❌ **NO** inventar colores: únicamente los tokens de `tailwind.config.js` + `white`.
- ✅ Mantener un único color de acción dominante por vista (el "principal" del momento).

---

## 2. Spacing (márgenes y paddings)

Valores más frecuentes **medidos** en todos los templates. Respetar estas escalas; no usar valores arbitrarios (`p-7`, `mx-auto` sin patrón, `mt-9`, etc.) salvo necesidad real.

### Contenedor y hero de página (patrón estándar)

```html
<section class="container px-4 py-4 max-w-lg mx-auto mt-8">   <!-- página -->
  <div class="text-primary bg-background2 py-8 rounded-2xl px-4 flex flex-col gap-2"> <!-- hero -->
    <h1 class="text-5xl font-bold text-center">...</h1>
```

| Elemento            | Clase estándar                                     |
| ------------------- | -------------------------------------------------- |
| Contenedor de página | `container px-4 py-4 max-w-lg mx-auto mt-8`        |
| Hero / caja principal | `bg-background2 py-8 rounded-2xl px-4 flex flex-col gap-2` |
| Achura de página    | `max-w-lg` (móvil-first)                           |

### Escala de padding permitida

`p-1` a `p-8`. Valores de uso medido:

| Valor | Uso                                        |
| ----- | ------------------------------------------ |
| `p-1` / `p-2` | elementos compactos (chips, celdas, iconos) |
| `p-3` | inputs / filas internas                     |
| `p-4` | tarjeta estándar pequeña                    |
| `p-5` | **tarjeta de contenido estándar**            |
| `p-6` | tarjeta media / bloques                     |
| `p-8` | **tarjetas destacadas / CTA hero**           |

Direccionales: `px-3/4/5/6/8`, `py-2/3/4/8`, `pb-2`, `pt-4` (más comunes).

### Escala de márgenes

| Valor | Uso                                                |
| ----- | -------------------------------------------------- |
| `mt-8` | separación del tope de página                      |
| `mt-4` / `mt-6` | separar bloques entre sí                  |
| `mb-1` / `mb-2` | título con texto corto                         |
| `mb-4` / `mb-6` | debajo de títulos/headers de bloque           |
| `mb-8` | entre secciones grandes                            |
| `m-2`  | notificaciones flotantes                          |

Regla práctica: **usar siempre un borde (top o bottom) consistente** para separar bloques jerárquicos, y `gap` para separar hermanos dentro de un contenedor flex.

### Gaps y agrupaciones

| Valor      | Uso                                   |
| ---------- | ------------------------------------- |
| `gap-1/2`  | filas compactas (iconos + texto)      |
| `gap-3/4`  | columnas de formulario / listas       |
| `gap-6`    | **tarjetas apiladas**                 |
| `space-y-3/4` | separación vertical en bloques     |

### Radio (border-radius)

| Clase          | Uso                                    |
| -------------- | -------------------------------------- |
| `rounded-full` | badges, iconos circulares, avatares    |
| `rounded-2xl`  | **tarjetas** y cajas principales       |
| `rounded-xl`   | tarjetas menores, celdas de calendario |
| `rounded-lg`   | inputs / botones pequeños              |
| `rounded-md`   | mini-elementos                         |

### Achuras (max-width)

- `max-w-lg` → página.
- `max-w-sm` → **tarjetas destacadas** (con `mx-auto` si el padre no es flex centrado).
- `max-w-md` → pantallas de éxito / contenido centrado.

### Regla dura de consistencia

> **Tarjetas hermanas dentro de un mismo bloque/página DEBEN compartir padding y max-width.**
> Ejemplo del error corregido: el cartel de "Coach AI" en `my-week` usaba `p-6` full-width mientras la tarjeta vecina "Explorar planes" usa `p-8 max-w-sm`. Se alineó a `p-8 max-w-sm mx-auto`.

---

## 3. Tipografía

Uso medido (jerarquía dentro de una página):

| Elemento                     | Clases                                              |
| ---------------------------- | --------------------------------------------------- |
| H1 hero de página            | `text-5xl font-bold text-center` (`text-primary` o `text-white`) |
| Título de sección / tarjeta  | `text-2xl` / `text-xl` + `font-bold` en `text-primary` |
| Título de widget menor       | `text-lg font-semibold`                              |
| Texto de párrafo             | `text-sm` o `text-base` en `text-text2`, `leading-relaxed` |
| Texto auxiliar / etiquetas   | `text-xs` en `text-text2`                            |
| Badge / mini-etiqueta        | `text-xs font-bold uppercase tracking-widest`        |
| Pesos                        | `font-bold`, `font-semibold`, `font-medium`          |

Fuentes (globales): `Lato` (sans, cuerpo) y `Work Sans` (heading).

---

## 4. Botones y Notificaciones

### Botones: siempre `app-btn`

**Prohibido** crear botones con clases sueltas (`<button class="bg-...">`). Usar `app-btn` (renderiza `<a>` cuando hay `routerLink`, `<button>` si no).

| Prop             | Valores                                            | Uso                                      |
| ---------------- | -------------------------------------------------- | ---------------------------------------- |
| `variant`        | `raised` (sólido=CTA) / `outline` (borde=contextual) / `ghost` (cancelar) / `flat` (sutil) | según jerarquía del botón |
| `size`           | `sm` / `md`                                        | `md` para CTAs destacados               |
| `color`          | tokens de la tabla de la §1                        | según el rol de la acción               |
| `showIcon`       | `true` → flecha (o `<app-icon>` proyectado)        | CTAs                                    |
| `descriptionText`| texto secundario bajo el label                     | explicitar la acción                    |
| `routerLink`     | ruta destino                                       | navegación (renderiza `<a>`)            |
| `isDisabled`     | `true`                                             | procesos en curso (`deleting()`, etc.)  |
| `buttonType`     | `button` / `submit`                                | formularios                             |

Ejemplos patrón:

```html
<!-- CTA principal -->
<app-btn [text]="'Coach AI'" [descriptionText]="'Generar mi plan semanal'"
  [variant]="'raised'" [size]="'md'" [showIcon]="true" [color]="'accent'"
  [routerLink]="'/coach'"></app-btn>

<!-- Destructiva -->
<app-btn [text]="'Eliminar plan'" [color]="'error'" [variant]="'outline'"
  [size]="'sm'" [isDisabled]="deleting()" (click)="onDeletePlan()"></app-btn>

<!-- Cancelar neutro -->
<app-btn [text]="'Cancelar'" [variant]="'ghost'" [color]="'text'"
  (click)="onClose()"></app-btn>
```

### Notificaciones: `app-notification`

| Prop       | Valores                                   |
| ---------- | ----------------------------------------- |
| `type`     | `success` / `error` / `warning` / `info`  |
| `message`  | texto a mostrar                           |
| `duration` | ms hasta auto-cierre (default `5000`)     |
| `closeOuput` | evento al cerrar                        |

Visual: borde inferior de 4px del color semáforo (`border-green-500` / `red` / `yellow` / `blue`), icono circular con `✓ ✕ ! i`, fondo `bg-background3`. Márgen flotante `m-2`.

---

## 5. HTML Semántico

Objetivo del repo (AGENTS §6.1): `<section>`/`<article>` por bloque, `<header>`/`<footer>` por bloque, `<ul>/<li>` para listas, `<nav>` para navegación, **`<div>` solo para layout puro**. Referencia: `src/app/pages/auth/callback/callback.html`.

---

## 6. Checklist de Revisión (antes de editar o aprobar un cambio de UI)

- [ ] ¿Se usa `app-btn` en vez de botones a medida?
- [ ] ¿El `color` coincide con el rol de la acción (tabla §1)? Destructiva→`error`, CTA→`primary/accent/confirm`, éxito→`success`.
- [ ] ¿Padding dentro de la escala estándar (`p-1..8`) y sin valores raros?
- [ ] ¿Tarjetas hermanas comparten **padding + max-width + radius**?
- [ ] ¿Los márgenes usan valores de la escala (`mt-2/4/6/8`, `mb-2/4/6/8`)?
- [ ] ¿El separador de bloques es consistente (mismo `gap`/`space-y`/`mt-*` que el resto)?
- [ ] ¿La jerarquía tipográfica respeta la §3 (no saltar h2→h4, tamaños de la escala)?
- [ ] ¿HTML semántico (§5) y `aria-label` en secciones/controles sin texto visible?
- [ ] ¿No se rompió ninguna convención de la página/componente vecino (mismo patrón de datos)?