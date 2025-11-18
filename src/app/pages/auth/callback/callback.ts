import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';
import { HttpClient } from '@angular/common/http';

@Component({
    selector: 'app-callback',
    imports: [],
    standalone: true,
    templateUrl: './callback.html',
    styleUrl: './callback.css',
})
export class Callback implements OnInit {
    constructor(
        private routerActivaded: ActivatedRoute,
        private authSvc: AuthService,
        private http: HttpClient,
        private router: Router
    ) {}

    ngOnInit(): void {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const codeVerifier = sessionStorage.getItem('pkce_verifier');

        if (!code || !codeVerifier) return;

        this.authSvc.loginWithGoogle(code, codeVerifier).subscribe(({ data }: any) => {
            // const token: string = data.loginWithGoogle;

            // sessionStorage.removeItem('pkce_verifier');
            this.router.navigate(['/home']);
        });
    }
}
