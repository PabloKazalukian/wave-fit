import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Lista de colores válidos de tu tailwind.config
const VALID_COLORS = [
    'primary',
    'secondary',
    'confirm',
    'accent',
    'success',
    'error',
    'warning',
    'text',
];

@Component({
    selector: 'app-btn',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './btn.html',
})
export class BtnComponent {
    @Input() text: string = '';
    @Input() isDisabled: boolean = false;
    @Input() variant:
        | 'basic'
        | 'raised'
        | 'stroked'
        | 'flat'
        | 'outline'
        | 'outlineLigth'
        | 'ghost' = 'basic';
    @Input() color: string = 'primary';
    @Input() routerLink?: string;
    @Input() buttonType: 'button' | 'submit' | 'reset' = 'button';

    private sanitizeColor(color: string): string {
        // Quita terminaciones tipo 2, 3, Light, Dark y valida contra colores permitidos
        let base = color.replace(/2|3|Light|Dark$/, '');
        return VALID_COLORS.includes(base) ? base : 'primary';
    }

    get baseClasses(): string {
        return 'w-full rounded-lg  font-sm transition-colors focus:outline-none focus:ring-0 px-3 py-2 text-center';
    }

    get variantClasses(): string {
        const cleanColor = this.sanitizeColor(this.color);
        const color3 = cleanColor + '3';
        switch (this.variant) {
            case 'basic':
                return `hover:bg-${cleanColor} hover:text-white`;
            case 'raised':
                return `bg-${this.color} text-white font-semibold shadow-md hover:bg-${cleanColor}Hover`;
            case 'stroked':
                return `border border-surface hover:bg-${cleanColor}-hover-faint`;
            case 'flat':
                return `bg-${color3} text-${cleanColor}Light hover:bg-${cleanColor}-hover-faint`;
            case 'outline':
                return `text-${this.color} border border-${this.color} font-semibold shadow-md hover:text-white`;

            case 'outlineLigth':
                return `border border-${cleanColor}Light hover:bg-${cleanColor}-hover-faint  text-${cleanColor}Light hover:text-${cleanColor}`;
            case 'ghost':
                return `hover:bg-black-faint hover:text-white`;
            default:
                return '';
        }
    }

    get disabledClasses(): string {
        return this.isDisabled ? 'opacity-50 cursor-not-allowed' : '';
    }

    get classList(): string {
        return [this.baseClasses, this.variantClasses, this.disabledClasses].join(' ');
    }
}
