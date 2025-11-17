import { Component, OnInit } from '@angular/core';
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
    styleUrl: './login.css',
})
export class Login implements OnInit {
    contactForm!: FormGroup<LoginFormType>;
    login!: boolean | null;
    loading: boolean = false;

    constructor(
        private authSvc: AuthService,
        private router: Router,
        private credentialsSvc: CredentialsService
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
            this.authSvc.login(this.identifierControl.value, this.passwordControl.value).subscribe({
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
                    console.log(result);
                },
                error: (error) => {
                    this.loading = false;
                    this.login = false;
                    console.error('There was an error sending the query', error);
                },
            });
            // ) {
            // this.loading = false;
            // this.login = true;
            // if (this.contactForm.get('remember')?.value) {
            //     this.credentialsSvc.saveCredentials({
            //         remember: this.contactForm.get('remember')?.value ?? false,
            //         identifier: this.contactForm.get('identifier')?.value ?? '',
            //         password: this.contactForm.get('password')?.value ?? '',
            //     });
            // }
            // this.router.navigate(['/home']);
            // } else {
            //     this.loading = false;
            //     this.login = false;
            // }
        }, 1000);
    }

    loginWithGoogle(): void {
        window.location.href = 'https://wavefit.test/auth/google/redirect';
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
