import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './shared/components/layout/header/header';
import { Footer } from './shared/components/layout/footer/footer';
import { WarmupService } from './core/services/warmup.service';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, Header, Footer],
    templateUrl: './app.html',
})
export class AppComponent {
    private readonly warmupSvc = inject(WarmupService);
    // La validación de autenticación inicial se movió al APP_INITIALIZER en core/auth/auth.initializer.ts
}
