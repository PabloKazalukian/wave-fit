import { Component, input, computed } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { NgClass } from '@angular/common';

type InputNumberVariant = 'buttons' | 'arrows' | 'none';

@Component({
    selector: 'app-input-number',
    standalone: true,
    imports: [ReactiveFormsModule, NgClass],
    templateUrl: './input-number.html',
})
export class InputNumber {
    control = input.required<FormControl<number | null>>();
    label = input<string>('');
    step = input<number>(1);
    min = input<number | null>(null);
    max = input<number | null>(null);
    variant = input<InputNumberVariant>('buttons');

    widthClass = computed(() => {
        const value = this.control().value ?? 0;
        return value > 99 ? 'w-16' : 'w-12';
    });

    showError = computed(() => {
        const c = this.control();
        return c?.touched && c?.invalid;
    });

    increment() {
        const value = this.control().value ?? 0;
        const next = value + this.step();

        if (this.max() !== null && next > this.max()!) return;

        this.control().setValue(next);
        this.control().markAsDirty();
    }

    decrement() {
        const value = this.control().value ?? 0;
        const next = value - this.step();

        if (this.min() !== null && next < this.min()!) return;

        this.control().setValue(next);
        this.control().markAsDirty();
    }

    onInput(event: Event) {
        const value = Number((event.target as HTMLInputElement).value);

        if (isNaN(value)) return;

        this.control().setValue(value);
    }
}
