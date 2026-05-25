importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

const { precacheAndRoute } = self.workbox.precaching;
const { registerRoute } = self.workbox.routing;
const { CacheFirst, NetworkFirst } = self.workbox.strategies;
const { ExpirationPlugin } = self.workbox.expiration;
const { CacheableResponsePlugin } = self.workbox.cacheableResponse;

self.addEventListener('fetch', (event) => {
    console.log('[SW FETCH]', event.request.url, event.request.method);
});

precacheAndRoute(self.__WB_MANIFEST || []);

// Cache images
registerRoute(
    ({ request }) => request.destination === 'image',
    new CacheFirst({
        cacheName: 'images',
        plugins: [new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 })],
    }),
);

// Cache fonts
registerRoute(
    ({ request }) => request.destination === 'font',
    new CacheFirst({
        cacheName: 'webfonts',
        plugins: [
            new CacheableResponsePlugin({ statuses: [0, 200] }),
            new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 }),
        ],
    }),
);

// SPA navigation fallback
registerRoute(
    ({ request }) => request.mode === 'navigate',
    async ({ request }) => {
        try {
            return await fetch(request);
        } catch (error) {
            const cachedResponse =
                (await caches.match('/index.html')) || (await caches.match('index.html'));
            if (cachedResponse) return cachedResponse;
            throw error;
        }
    },
);

// Handle API/GraphQL requests using IndexedDB for POST support
registerRoute(
    ({ request }) => request.method === 'POST' && request.url.includes('/graphql'),

    async ({ request }) => {
        let body = null;
        let cacheKey = null;

        try {
            console.group('[GRAPHQL REQUEST]');

            console.log('[REQUEST]', {
                url: request.url,
                method: request.method,
            });

            // =========================
            // PARSE BODY
            // =========================
            try {
                body = await request.clone().json();

                const isMutation = body?.query?.includes('mutation');

                cacheKey = JSON.stringify({
                    operationName: body?.operationName,
                    variables: body?.variables || {},
                });

                console.log('[GRAPHQL BODY]', {
                    operationName: body?.operationName,
                    variables: body?.variables,
                    isMutation,
                });

                console.log('[CACHE KEY]', cacheKey);

                console.log('[WHITELISTED]', GRAPHQL_WHITELIST.includes(body?.operationName));
            } catch (err) {
                console.error('[BODY PARSE ERROR]', err);
            }

            // =========================
            // NETWORK TRY
            // =========================
            try {
                console.log('[NETWORK TRY]', body?.operationName);

                const response = await fetch(request);

                console.log('[NETWORK SUCCESS]', body?.operationName, response.status);

                const cloned = response.clone();

                try {
                    const resBody = await cloned.json();

                    console.log('[NETWORK RESPONSE BODY]', resBody);

                    if (resBody?.data) {
                        console.log('[CACHE SAVE START]', body?.operationName);

                        await putInCache(cacheKey, resBody.data);

                        console.log('[CACHE SAVED]', body?.operationName);
                    } else {
                        console.warn('[NO DATA TO CACHE]', body?.operationName);
                    }
                } catch (jsonErr) {
                    console.error('[RESPONSE JSON PARSE ERROR]', jsonErr);
                }

                console.groupEnd();

                return response;
            } catch (networkError) {
                console.error('[NETWORK FAILED]', body?.operationName, networkError);

                console.log('[OFFLINE FALLBACK START]', body?.operationName);

                // =========================
                // CACHE FALLBACK
                // =========================
                const cachedData = await getFromCache(cacheKey);

                if (cachedData) {
                    console.log('[OFFLINE CACHE HIT]', body?.operationName);

                    console.log('[OFFLINE DATA]', cachedData);

                    console.groupEnd();

                    return new Response(JSON.stringify({ data: cachedData }), {
                        status: 200,
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    });
                }

                console.warn('[OFFLINE CACHE MISS]', body?.operationName);

                console.groupEnd();

                return new Response(
                    JSON.stringify({
                        errors: [
                            {
                                message: 'Sin conexión y sin caché disponible',
                            },
                        ],
                    }),
                    {
                        status: 503,
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    },
                );
            }
        } catch (fatalError) {
            console.error('[SW FATAL ERROR]', fatalError);

            console.error('[FATAL CONTEXT]', {
                operationName: body?.operationName,
                variables: body?.variables,
                cacheKey,
            });

            console.groupEnd();

            return new Response(
                JSON.stringify({
                    errors: [
                        {
                            message: 'SW Fatal Error',
                        },
                    ],
                }),
                {
                    status: 500,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            );
        }
    },

    'POST',
);

// --- IndexedDB Helper (Singleton Connection) ---
const DB_NAME = 'WaveFitDB';
const DB_VERSION = 31;
const STORE_NAME = 'graphqlCache';

let dbPromise = null;

function getDB() {
    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onerror = (event) => reject(event.target.error);
            request.onsuccess = (event) => resolve(event.target.result);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'cacheKey' });
                }
                if (!db.objectStoreNames.contains('pendingMutations')) {
                    const store = db.createObjectStore('pendingMutations', { keyPath: 'id' });
                    store.createIndex('operationName', 'operationName', { unique: false });
                    store.createIndex('status', 'status', { unique: false });
                }
                if (!db.objectStoreNames.contains('authUser')) {
                    db.createObjectStore('authUser', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('exercises')) {
                    db.createObjectStore('exercises', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('routines')) {
                    db.createObjectStore('routines', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('plans')) {
                    db.createObjectStore('plans', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('tracking')) {
                    db.createObjectStore('tracking', { keyPath: 'id' });
                }
            };
        });
    }
    return dbPromise;
}

async function putInCache(cacheKey, data) {
    console.log('[IDB PUT]', {
        cacheKey,
        data,
    });
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction([STORE_NAME], 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put({ cacheKey, data, updatedAt: Date.now() });
        req.onsuccess = () => resolve();
        req.onerror = (e) => reject(e.target.error);
    });
}

async function getFromCache(cacheKey) {
    console.log('[IDB GET]', {
        cacheKey,
    });
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction([STORE_NAME], 'readonly');
        const req = tx.objectStore(STORE_NAME).get(cacheKey);
        req.onsuccess = (e) => resolve(e.target.result?.data ?? null);
        req.onerror = (e) => reject(e.target.error);
    });
}

const GRAPHQL_WHITELIST = ['GetExercises', 'Me'];

self.addEventListener('message', (event) => {
    if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-mutations') {
        event.waitUntil(
            self.clients.matchAll().then((clients) => {
                clients.forEach((c) => c.postMessage({ type: 'PROCESS_SYNC_QUEUE' }));
            }),
        );
    }
});
