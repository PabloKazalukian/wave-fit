import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnChanges } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
    selector: 'app-checkbox',
    standalone: true,
    imports: [ReactiveFormsModule],
    templateUrl: './checkbox.html',
})
export class CheckboxComponent implements AfterViewInit, OnChanges {
    @Input() control!: FormControl<boolean>;
    @Input() text = '';
    @Input() indeterminate = false;

    @ViewChild('checkboxInput', { static: false }) checkboxInput!: ElementRef<HTMLInputElement>;

    ngAfterViewInit(): void {
        this.updateIndeterminate();
    }

    ngOnChanges(): void {
        this.updateIndeterminate();
    }

    private updateIndeterminate(): void {
        if (this.checkboxInput?.nativeElement) {
            this.checkboxInput.nativeElement.indeterminate = this.indeterminate;
        }
    }
}
