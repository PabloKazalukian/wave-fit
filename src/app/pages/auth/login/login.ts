import { Component, OnInit } from '@angular/core';
import { FormInputComponent } from '../../../shared/components/ui/input/input';
import { FormControlsOf } from '../../../shared/utils/form-types.util';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CheckboxComponent } from '../../../shared/components/ui/checkbox/checkbox';
import { BtnComponent } from '../../../shared/components/ui/btn/btn';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

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
    ],
    standalone: true,
    templateUrl: './login.html',
    styleUrl: './login.css',
})
export class Login implements OnInit {
    contactForm!: FormGroup<LoginFormType>;
    login!: boolean | null;
    loading: boolean = false;

    constructor(private authSvc: AuthService, private router: Router) {}

    ngOnInit(): void {
        this.contactForm = this.initForm();
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
        // this.login = null;
        if (this.authSvc.login(this.identifierControl.value, this.passwordControl.value)) {
            this.login = true;
            this.router.navigate(['/home']);
        } else {
            this.login = false;
        }
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
