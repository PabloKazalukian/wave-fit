import { Component, inject, OnInit } from '@angular/core';
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
export class AppComponent implements OnInit {
    private readonly authStateSvc = inject(AuthService);
    private readonly router = inject(Router);

    ngOnInit(): void {
        this.router.events.subscribe((event) => {
            if (event instanceof NavigationStart) {
                const currentUrl = event.url;

                if (!currentUrl.startsWith('/auth/callback')) {
                    this.authStateSvc.me().subscribe({
                        error: () => {
                            this.authStateSvc.logout();
                            this.router.navigate(['/auth/login']);
                        },
                    });
                }
            }
        });
    }
}
