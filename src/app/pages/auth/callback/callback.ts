import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-callback',
    imports: [],
    standalone: true,
    templateUrl: './callback.html',
})
export class Callback implements OnInit {
    private destroyRef = inject(DestroyRef);

    constructor(
        private authSvc: AuthService,
        private router: Router,
    ) {}

    ngOnInit(): void {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const codeVerifier = sessionStorage.getItem('pkce_verifier');

        if (!code || !codeVerifier) return;

        this.authSvc
            .loginWithGoogle(code, codeVerifier)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(({ data }: any) => {
                this.router.navigate(['/home']);
            });
    }
}
