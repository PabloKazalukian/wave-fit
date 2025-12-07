import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormInputComponent } from '../../../shared/components/ui/input/input';
import { FormControlsOf } from '../../../shared/utils/form-types.util';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CheckboxComponent } from '../../../shared/components/ui/checkbox/checkbox';
import { BtnComponent } from '../../../shared/components/ui/btn/btn';
import { AuthService } from '../../../core/services/auth/auth.service';
import { Router } from '@angular/router';
import { Alert } from '../../../shared/components/ui/alert/alert';
import { Loading } from '../../../shared/components/ui/loading/loading';
import { CredentialsService } from '../../../core/services/auth/credentials.service';
import { WaveLogoTextComponent } from '../../../shared/components/ui/logos/wave-logo-text/wave-logo-text';
import { environment } from '../../../../environments/environments';
import { generatePkcePair } from '../../../shared/utils/pkce.utils';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

type LoginFormType = FormControlsOf<LoginWithCredentials>;
export interface LoginWithCredentials {
    identifier: string;
    password: string;
    remember: boolean;
}

@Component({
    selector: 'app-login',
    imports: [
        FormInputComponent,
        FormInputComponent,
        CheckboxComponent,
        ReactiveFormsModule,
        BtnComponent,
        Alert,
        Loading,
        WaveLogoTextComponent,
    ],
    standalone: true,
    templateUrl: './login.html',
})
export class Login implements OnInit {
    private destroyRef = inject(DestroyRef);

    contactForm!: FormGroup<LoginFormType>;
    login!: boolean | null;
    loading: boolean = false;

    constructor(
        private authSvc: AuthService,
        private router: Router,
        private credentialsSvc: CredentialsService,
    ) {}

    ngOnInit(): void {
        this.contactForm = this.initForm();
        const credentials = this.credentialsSvc.getCredentials();
        if (credentials.remember) {
            this.contactForm.patchValue({
                identifier: credentials.identifier ?? '',
                password: credentials.password ?? '',
                remember: credentials.remember,
            });
        }
    }

    initForm(): FormGroup<LoginFormType> {
        return new FormGroup<LoginFormType>({
            identifier: new FormControl('', {
                nonNullable: true,
                validators: [Validators.required, Validators.minLength(3)],
            }),
            password: new FormControl('', {
                nonNullable: true,
                validators: [Validators.required, Validators.minLength(3)],
            }),
            remember: new FormControl(false, { nonNullable: true }),
        });
    }

    onSubmit(): void {
        this.loading = true;
        // this.login = false;
        this.login = null;
        setTimeout(() => {
            // if (
            this.authSvc
                .login(this.identifierControl.value, this.passwordControl.value)
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next: (result) => {
                        this.loading = false;
                        this.login = false;
                        if (this.contactForm.get('remember')?.value) {
                            this.credentialsSvc.saveCredentials({
                                remember: this.contactForm.get('remember')?.value ?? false,
                                identifier: this.contactForm.get('identifier')?.value ?? '',
                                password: this.contactForm.get('password')?.value ?? '',
                            });
                        }
                        this.router.navigate(['/home']);
                    },
                    error: (error) => {
                        this.loading = false;
                        this.login = false;
                        console.error('There was an error sending the query', error);
                    },
                });
            // }
        }, 1000);
    }

    async loginWithGoogle(): Promise<void> {
        const { code_verifier, code_challenge } = await generatePkcePair();

        sessionStorage.setItem('pkce_verifier', code_verifier);

        const params = new URLSearchParams({
            client_id: environment.client_id,
            redirect_uri: 'http://localhost:4200/auth/callback',
            response_type: 'code',
            scope: 'openid email profile',
            code_challenge: code_challenge,
            code_challenge_method: 'S256',
        });

        window.location.href = 'https://accounts.google.com/o/oauth2/v2/auth?' + params.toString();
    }

    get identifierControl(): FormControl<string> {
        return this.contactForm.get('identifier')! as FormControl<string>;
    }

    get passwordControl(): FormControl<string> {
        return this.contactForm.get('password')! as FormControl<string>;
    }

    get rememberControl(): FormControl<boolean> {
        return this.contactForm.get('remember')! as FormControl<boolean>;
    }
}
