import { Component, Input } from '@angular/core';
import { COLOR_VALUES } from '../../../utils/color.type';
import { NgClass, NgStyle } from '@angular/common';

@Component({
    selector: 'app-loading',
    imports: [NgStyle],
    standalone: true,
    templateUrl: './loading.html',
    styleUrl: './loading.css',
    // styles: `
    //     .loader {
    //         width: 8px;
    //         height: 48px;
    //         display: inline-block;
    //         position: relative;
    //         border-radius: 4px;
    //         box-sizing: border-box;
    //         animation: animloader 0.6s linear infinite;
    //         color: currentColor; /* clave para que el color se aplique */
    //     }

    //     @keyframes animloader {
    //         0% {
    //             box-shadow:
    //                 20px -10px currentColor,
    //                 40px 10px currentColor,
    //                 60px 0px currentColor;
    //         }
    //         25% {
    //             box-shadow:
    //                 20px 0px currentColor,
    //                 40px 0px currentColor,
    //                 60px 10px currentColor;
    //         }
    //         50% {
    //             box-shadow:
    //                 20px 10px currentColor,
    //                 40px -10px currentColor,
    //                 60px 0px currentColor;
    //         }
    //         75% {
    //             box-shadow:
    //                 20px 0px currentColor,
    //                 40px 0px currentColor,
    //                 60px -10px currentColor;
    //         }
    //         100% {
    //             box-shadow:
    //                 20px -10px currentColor,
    //                 40px 10px currentColor,
    //                 60px 0px currentColor;
    //         }
    //     }
    // `,
})
export class Loading {
    @Input() color: COLOR_VALUES = 'primary';

    constructor() {}

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
