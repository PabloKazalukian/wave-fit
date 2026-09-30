import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { environment } from './environments/environments';
import { AppComponent } from './app/app';
import { appConfig } from './app/app.config';

if (environment.production) {
    enableProdMode();
}

if ('serviceWorker' in navigator && !environment.production) {
    // navigator.serviceWorker.getRegistrations().then((registrations) => {
    //     registrations.forEach((registration) => registration.unregister());
    // });
}

bootstrapApplication(AppComponent, appConfig).then(() => {
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
});
