import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-callback',
    imports: [],
    standalone: true,
    templateUrl: './callback.html',
})
export class Callback implements OnInit {
    private destroyRef = inject(DestroyRef);

    private readonly authSvc = inject(AuthService);
    private readonly router = inject(Router);

    ngOnInit(): void {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const codeVerifier = sessionStorage.getItem('pkce_verifier');

        if (!code || !codeVerifier) return;

        this.authSvc
            .loginWithGoogle(code, codeVerifier)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.router.navigate(['/home']);
            });
    }
}
