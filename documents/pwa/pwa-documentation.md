# WaveFit PWA - Documentación

## 1. Arquitectura General

WaveFit usa **Workbox** como único Service Worker (SW). No se usa `@angular/service-worker`.

| Aspecto | Workbox SW |
|---------|------------|
| Config | `workbox-config.js` + `src/sw.js` |
| Generado por | `workbox injectManifest` (post-build) |
| Archivo generado | `dist/wave-fit/browser/sw.js` |
| Rol | Precaching + caching avanzado + IndexedDB para GraphQL |

---

## 2. Build Pipeline

El script `npm run build` ejecuta:

```bash
ng build                     # Build Angular
workbox injectManifest       # Inyecta precache en src/sw.js
```

### `workbox injectManifest`

- Toma `src/sw.js` (fuente) y busca el marcador `self.__WB_MANIFEST`
- Escanea `dist/wave-fit/browser/` con los patrones de `workbox-config.js`
- Reemplaza `self.__WB_MANIFEST` con la lista real de archivos del build
- Genera `dist/wave-fit/browser/sw.js` con el manifiesto inyectado

```js
// workbox-config.js
module.exports = {
    globDirectory: 'dist/wave-fit/browser',
    globPatterns: ['**/*.{js,css,html,png,svg,ico,webmanifest,ttf,woff,woff2}'],
    swSrc: 'src/sw.js',
    swDest: 'dist/wave-fit/browser/sw.js',
    maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
};
```

---

## 3. Web App Manifest

Definido en `public/manifest.webmanifest`:

```json
{
  "name": "WaveFit",
  "short_name": "WaveFit",
  "display": "standalone",
  "scope": "/",
  "start_url": "/",
  "theme_color": "#1e1b4b",
  "background_color": "#000000",
  "icons": [
    { "src": "icons/android-chrome-192x192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "icons/android-chrome-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

Se referencia desde `index.html`:

```html
<link rel="manifest" href="manifest.webmanifest" />
<meta name="theme-color" content="#1e1b4b" />
<link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
```

---

## 4. Service Worker Custom (`src/sw.js`)

### 4.1 Precaching (Workbox)

```js
precacheAndRoute(self.__WB_MANIFEST);
```

Workbox reemplaza `self.__WB_MANIFEST` por la lista de archivos del build. Todos los assets JS, CSS, HTML, imágenes y fuentes quedan precacheados al instalar el SW.

### 4.2 Estrategias de Caching

| Recurso | Estrategia | Cache Name | Detalles |
|---------|-----------|------------|----------|
| Imágenes | `CacheFirst` | `images` | Máx. 60 entradas, expira a los 30 días |
| Fuentes | `CacheFirst` | `webfonts` | Máx. 20 entradas, expira a 1 año |
| Navegación (SPA) | `NetworkFirst` con fallback | — | Si falla la red, sirve `index.html` precacheado |
| GraphQL (POST) | `NetworkFirst` + IndexedDB | — | Cachea respuestas en IndexedDB para operaciones whitelisteadas |

### 4.3 Fallback de Navegación (SPA)

```js
registerRoute(
    ({ request }) => request.mode === 'navigate',
    async ({ request }) => {
        try {
            return await fetch(request);
        } catch (error) {
            let cachedResponse = await caches.match('/index.html');
            if (!cachedResponse) cachedResponse = await caches.match('index.html');
            if (cachedResponse) return cachedResponse;
            throw error;
        }
    }
);
```

Garantiza que cualquier ruta de la SPA funcione offline devolviendo `index.html`.

### 4.4 Cache de GraphQL en IndexedDB

WaveFit cachea consultas GraphQL **POST** en IndexedDB (`WaveFitDB` / `graphqlCache`) para operaciones de solo lectura (whitelist):

```js
const GRAPHQL_WHITELIST = ['GetExercises', 'Me'];
```

Flujo:
1. Intenta fetch a la red
2. Si la red responde OK (sin errores GraphQL), guarda en IndexedDB
3. Si la red falla, devuelve el dato cacheado desde IndexedDB

Esto permite que consultas como `GetExercises` y `Me` funcionen offline.

**Object Stores en IndexedDB:**

| Store | Key | Propósito |
|-------|-----|-----------|
| `graphqlCache` | `cacheKey` | Respuestas de consultas GraphQL cacheadas |
| `pendingMutations` | `id` | Mutaciones pendientes (futuro soporte offline-write) |
| `authUser` | `id` | Datos del usuario autenticado |

### 4.5 Skip Waiting

```js
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
```

Permite que la nueva versión del SW se active inmediatamente cuando el usuario confirma la actualización desde `main.ts`.

---

## 5. Registro del Service Worker

En `src/main.ts`:

```ts
if ('serviceWorker' in navigator && environment.production) {
    import('workbox-window').then(({ Workbox }) => {
        const wb = new Workbox('/sw.js');

        wb.addEventListener('installed', (event) => {
            if (event.isUpdate) {
                if (confirm('Nueva versión disponible. ¿Deseas actualizar?')) {
                    window.location.reload();
                }
            }
        });

        wb.register().catch((err) => {
            console.error('Service Worker registration failed:', err);
        });
    });
}
```

- Solo se registra en **production**
- Usa `workbox-window` para manejar el ciclo de vida del SW
- Muestra un `confirm()` al usuario cuando hay una nueva versión
- Al aceptar, recarga la página y envía `SKIP_WAITING`

---

## 6. Diagrama de Flujo

```
                     npm run build
                          │
                    ┌─────┴──────┐
                    │  ng build   │
                    └─────┬──────┘
                          │
                          ▼
                    dist/wave-fit/browser/
                    (build + assets)
                          │
                ┌─────────┴──────────┐
                │ workbox injectManifest │
                └─────────┬──────────┘
                          │
                          ▼
              dist/wave-fit/browser/sw.js
              (Workbox SW con precache inyectado)

                         ┌──────────────────────┐
                         │    Service Worker     │
                         │       (sw.js)         │
                         ├──────────────────────┤
                         │  precacheAndRoute()   │
                         │  CacheFirst (images)  │
                         │  CacheFirst (fonts)   │
                         │  Navigation fallback  │
                         │  GraphQL + IndexedDB  │
                         │  Skip Waiting handler │
                         └──────────────────────┘
```

---

## 7. Resumen de Capacidades Offline

| Funcionalidad | Online | Offline |
|--------------|--------|---------|
| Carga inicial de la app | ✅ Normal | ✅ Desde precache |
| Navegación entre rutas | ✅ Normal | ✅ Sirve `index.html` |
| Imágenes | ✅ Normal | ✅ Desde cache (CacheFirst) |
| Fuentes | ✅ Normal | ✅ Desde cache (1 año) |
| Lista de ejercicios (`GetExercises`) | ✅ API | ✅ Desde IndexedDB |
| Perfil usuario (`Me`) | ✅ API | ✅ Desde IndexedDB |
| Mutaciones (crear rutinas, etc.) | ✅ API | ❌ Sin conexión |

---

## 8. Scripts Relacionados

```json
"build": "ng build && npm run sw:build",
"sw:build": "workbox injectManifest workbox-config.js",
"serve:pwa": "npm run build && npx http-server dist/wave-fit/browser -p 4200 -a localhost -c-1 -o"
```
