import { Component, Input } from '@angular/core';
import { COLOR_VALUES } from '../../../utils/color.type';
import { NgStyle } from '@angular/common';

@Component({
    selector: 'app-loading',
    imports: [NgStyle],
    standalone: true,
    templateUrl: './loading.html',
    styleUrl: './loading.css',
})
export class Loading {
    @Input() color: COLOR_VALUES = 'primary';

    get colorClass() {
        return {
            'text-primary': this.color === 'primary',
            'text-secondary': this.color === 'secondary',
            'text-accent': this.color === 'accent',
            'text-success': this.color === 'success',
            'text-warning': this.color === 'warning',
            'text-error': this.color === 'error',
            'text-surface': this.color === 'surface',
            'text-confirm': this.color === 'confirm',
            'text-text': this.color === 'text',
        };
    }

    resolveColor(color: COLOR_VALUES): string {
        const map: Record<COLOR_VALUES, string> = {
            primary: '#50C878',
            secondary: '#3A6EBF',
            confirm: '#C83A6E',
            accent: '#F5C623',
            surface: '#6B6B6B',
            success: '#4CAF50',
            error: '#CC1E2C',
            warning: '#D66F6F',
            text: '#2F2F2F',
        };
        return map[color];
    }
}
