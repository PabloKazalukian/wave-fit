import { NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-alert',
    imports: [NgClass],
    standalone: true,
    templateUrl: './alert.html',
    styleUrl: './alert.css',
})
export class Alert {
    @Input() type: 'success' | 'error' | 'info' = 'info';
    @Input() message: string = '';

    constructor() {}
}
