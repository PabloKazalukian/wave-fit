import { Component, OnInit } from '@angular/core';
import { NavigationStart, Router, RouterOutlet } from '@angular/router';
import { Header } from './shared/components/layout/header/header';
import { Footer } from './shared/components/layout/footer/footer';
import { AuthService } from './core/services/auth/auth.service';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, Header, Footer],
    templateUrl: './app.html',
})
export class AppComponent {
    constructor(private authStateSvc: AuthService, private router: Router) {}
    ngOnInit(): void {
        this.router.events.subscribe((event) => {
            if (event instanceof NavigationStart) {
                const currentUrl = event.url;

                // Evitamos "/callback"
                if (!currentUrl.startsWith('/auth/callback')) {
                    this.authStateSvc.me().subscribe({
                        next: (user) => {},
                        error: (err) => {
                            this.router.navigate(['/auth/login']);
                        },
                    });
                }
            }
        });
    }
}
