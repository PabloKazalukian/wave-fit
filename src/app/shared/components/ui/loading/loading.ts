import { Component, Input } from '@angular/core';
import { COLOR_VALUES, LOADER_SIZE } from '../../../utils/color.type';
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

    @Input() size: LOADER_SIZE = 'md';

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
            text: '#ffffff',
            background2: '#151C17',
        };
        return map[color];
    }

    resolveSize(size: LOADER_SIZE) {
        const map: Record<
            LOADER_SIZE,
            { width: string; height: string; s1: string; s2: string; s3: string }
        > = {
            sm: { width: '6px', height: '20px', s1: '12px', s2: '24px', s3: '36px' },
            md: { width: '8px', height: '38px', s1: '20px', s2: '40px', s3: '60px' },
            lg: { width: '12px', height: '52px', s1: '30px', s2: '60px', s3: '90px' },
        };

        return map[size];
    }
}
