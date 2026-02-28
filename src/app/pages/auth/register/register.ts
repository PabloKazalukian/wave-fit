import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormInputComponent } from '../../../shared/components/ui/input/input';
import { FormControlsOf } from '../../../shared/utils/form-types.util';
import {
    AbstractControl,
    FormControl,
    FormGroup,
    ReactiveFormsModule,
    ValidationErrors,
    Validators,
} from '@angular/forms';
import { BtnComponent } from '../../../shared/components/ui/btn/btn';
import { AuthService } from '../../../core/services/auth/auth.service';
import { Router } from '@angular/router';
import { Alert } from '../../../shared/components/ui/alert/alert';
import { Loading } from '../../../shared/components/ui/loading/loading';
import { WaveLogoTextComponent } from '../../../shared/components/ui/logos/wave-logo-text/wave-logo-text';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface RegisterFormData {
    name: string;
    email: string;
    password: string;
    repeatPassword: string;
}

type RegisterFormType = FormControlsOf<RegisterFormData>;

@Component({
    selector: 'app-register',
    imports: [
        FormInputComponent,
        ReactiveFormsModule,
        BtnComponent,
        Alert,
        Loading,
        WaveLogoTextComponent,
    ],
    standalone: true,
    templateUrl: './register.html',
    styleUrl: './register.css',
})
export class Register implements OnInit {
    private destroyRef = inject(DestroyRef);

    registerForm!: FormGroup<RegisterFormType>;

    loading = signal(false);
    submitted = signal(false);
    success = signal<boolean | null>(null);
    errorMessage = signal('');

    private readonly authSvc = inject(AuthService);
    private readonly router = inject(Router);

    ngOnInit(): void {
        this.registerForm = this.initForm();
    }

    initForm(): FormGroup<RegisterFormType> {
        return new FormGroup<RegisterFormType>(
            {
                name: new FormControl('', {
                    nonNullable: true,
                    validators: [Validators.required, Validators.minLength(3)],
                }),
                email: new FormControl('', {
                    nonNullable: true,
                    validators: [Validators.required, Validators.email],
                }),
                password: new FormControl('', {
                    nonNullable: true,
                    validators: [Validators.required, Validators.minLength(6)],
                }),
                repeatPassword: new FormControl('', {
                    nonNullable: true,
                    validators: [Validators.required],
                }),
            },
            { validators: this.passwordsMatchValidator },
        );
    }

    passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
        const password = control.get('password')?.value;
        const repeatPassword = control.get('repeatPassword')?.value;
        return password === repeatPassword ? null : { passwordsMismatch: true };
    }

    onSubmit(): void {
        this.loading.set(true);
        this.submitted.set(true);
        this.success.set(null);

        setTimeout(() => {
            this.authSvc
                .register(
                    this.nameControl.value,
                    this.emailControl.value,
                    this.passwordControl.value,
                )
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next: (result) => {
                        this.loading.set(false);
                        if (result) {
                            this.success.set(true);
                            setTimeout(() => this.router.navigate(['/home']), 1500);
                        } else {
                            this.success.set(false);
                            this.errorMessage.set('No se pudo crear la cuenta. Intenta de nuevo.');
                        }
                    },
                    error: () => {
                        this.loading.set(false);
                        this.success.set(false);
                        this.errorMessage.set('Error en el servidor. Intenta más tarde.');
                    },
                });
        }, 1000);
    }

    get nameControl(): FormControl<string> {
        return this.registerForm.get('name')! as FormControl<string>;
    }

    get emailControl(): FormControl<string> {
        return this.registerForm.get('email')! as FormControl<string>;
    }

    get passwordControl(): FormControl<string> {
        return this.registerForm.get('password')! as FormControl<string>;
    }

    get repeatPasswordControl(): FormControl<string> {
        return this.registerForm.get('repeatPassword')! as FormControl<string>;
    }
}
