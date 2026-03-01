import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './shared/components/layout/header/header';
import { Footer } from './shared/components/layout/footer/footer';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, Header, Footer],
    templateUrl: './app.html',
})
export class AppComponent {
    // La validación de autenticación inicial se movió al APP_INITIALIZER en core/auth/auth.initializer.ts
}
