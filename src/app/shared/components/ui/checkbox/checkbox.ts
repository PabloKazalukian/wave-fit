import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
    selector: 'app-checkbox',
    standalone: true,
    imports: [ReactiveFormsModule],
    templateUrl: './checkbox.html',
})
export class CheckboxComponent {
    @Input() control!: FormControl<boolean>;
    @Input() text: string = '';
}
