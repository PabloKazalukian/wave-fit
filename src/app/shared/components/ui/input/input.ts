// input.component.ts
import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';

@Component({
    selector: 'app-input',
    standalone: true,
    imports: [ReactiveFormsModule, NgClass],
    templateUrl: './input.html',
})
export class FormInputComponent {
    @Input() control!: FormControl<string | null>;
    @Input() label!: string;
    @Input() type: 'text' | 'email' | 'password' = 'text';
    @Input() placeholder = '';
    @Input() showTogglePassword = false;

    hidePassword = true;

    get showError(): boolean {
        return this.control?.touched && this.control?.invalid;
    }

    togglePassword(): void {
        this.hidePassword = !this.hidePassword;
    }
}
