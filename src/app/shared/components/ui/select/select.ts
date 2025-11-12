import { NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SelectType } from '../../../interfaces/input.interface';

@Component({
    selector: 'app-select',
    imports: [ReactiveFormsModule],
    standalone: true,
    templateUrl: './select.html',
    styleUrl: './select.css',
})
export class FormSelectComponent {
    @Input() text: string = '';
    @Input() label!: string;
    @Input() placeholder: string = '';
    @Input() options: SelectType[] = [];
    @Input() control!: FormControl<string | null>;
}
