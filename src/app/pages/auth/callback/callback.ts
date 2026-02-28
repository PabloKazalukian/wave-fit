import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WaveLogoTextComponent } from '../../../shared/components/ui/logos/wave-logo-text/wave-logo-text';

@Component({
    selector: 'app-callback',
    imports: [WaveLogoTextComponent],
    standalone: true,
    templateUrl: './callback.html',
    styleUrl: './callback.css',
})
export class Callback implements OnInit {
    private destroyRef = inject(DestroyRef);

    private readonly authSvc = inject(AuthService);
    private readonly router = inject(Router);

    userName = '';

    ngOnInit(): void {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const codeVerifier = sessionStorage.getItem('pkce_verifier');

        if (!code || !codeVerifier) return;

        this.authSvc
            .loginWithGoogle(code, codeVerifier)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((res: any) => {
                this.userName = res?.user?.name || res?.name || 'Usuario';
                setTimeout(() => this.router.navigate(['/home']), 2500);
            });
    }

    manualRedirect(): void {
        this.router.navigate(['/home']);
    }
}
