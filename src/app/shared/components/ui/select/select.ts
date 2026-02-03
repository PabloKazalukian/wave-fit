import { NgClass } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SelectType } from '../../../interfaces/input.interface';
import { COLOR_VALUES } from '../../../utils/color.type';

@Component({
    selector: 'app-select',
    imports: [ReactiveFormsModule, NgClass],
    standalone: true,
    templateUrl: './select.html',
})
export class FormSelectComponent {
    text = input<string>('');
    label = input<string>();
    color = input<COLOR_VALUES>('primary');
    placeholder = input<string>('');
    control = input<FormControl<string | null>>(new FormControl<string | null>(''));
    options = input<SelectType[]>([]);
    clearValue = output<string>();

    get showError(): boolean {
        return this.control()?.touched && this.control()?.invalid;
    }

    get selectClasses() {
        return {
            'border-error': this.showError,
            'border-surface': !this.showError && !this.control().value,
            'border-primary': this.control().value && this.color() === 'primary',
            'border-secondary': this.control().value && this.color() === 'secondary',
            'border-accent': this.control().value && this.color() === 'accent',
            'border-confirm': this.control().value && this.color() === 'confirm',
            'border-success': this.control().value && this.color() === 'success',
            'border-warning': this.control().value && this.color() === 'warning',
            'border-text': this.control().value && this.color() === 'text',
        };
    }

    clear() {
        // this.control;
        this.clearValue.emit('');
        // .setValue('')
    }

    get selectTextClasses() {
        return {
            'hover:text-error': this.showError,
            'hover:text-surface': !this.showError && !this.control().value,
            'hover:text-primary': this.control().value && this.color() === 'primary',
            'hover:text-secondary': this.control().value && this.color() === 'secondary',
            'hover:text-accent': this.control().value && this.color() === 'accent',
            'hover:text-confirm': this.control().value && this.color() === 'confirm',
            'hover:text-success': this.control().value && this.color() === 'success',
            'hover:text-warning': this.control().value && this.color() === 'warning',
            'hover:text-text': this.control().value && this.color() === 'text',
        };
    }
}
