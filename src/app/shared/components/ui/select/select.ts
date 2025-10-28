import { NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

export interface SelectType {
    name: string;
    value: number | string;
}

@Component({
    selector: 'app-select',
    imports: [ReactiveFormsModule],
    standalone: true,
    templateUrl: './select.html',
    styleUrl: './select.css',
})
export class Select {
    @Input() text: string = '';
    @Input() label!: string;
    @Input() placeholder: string = '';
    @Input() options: SelectType[] = [];
    @Input() isDisabled: boolean = false;
    @Input() control!: FormControl<string | null>;
}
