import { Component, Input, ContentChild, input, AfterContentInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IconComponent } from '../icon/icon';

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
export class BtnComponent implements AfterContentInit {
    @Input() text = '';
    @Input() descriptionText = '';
    @Input() isDisabled = false;
    @Input() variant:
        | 'basic'
        | 'raised'
        | 'stroked'
        | 'flat'
        | 'outline'
        | 'outlineLigth'
        | 'outlineDark'
        | 'ghost' = 'basic';
    @Input() color: string = 'primary';
    @Input() routerLink?: string;
    @Input() buttonType: 'button' | 'submit' | 'reset' = 'button';
    @Input() size: 'sm' | 'md' = 'sm';
    showIcon = input<boolean>(false);

    // @ContentChild('iconTemplate') iconTemplate?: TemplateRef<any>;
    @ContentChild(IconComponent) icon?: IconComponent;

    private sanitizeColor(color: string): string {
        const base = color.replace(/2|3|Light|Dark$/, '');
        return VALID_COLORS.includes(base) ? base : 'primary';
    }

    get baseClasses(): string {
        const sizeClasses = this.getSizeClasses();
        const iconSpacing = this.showIcon()
            ? 'flex items-center justify-center space-x-2'
            : 'text-center';

        return `w-full rounded-2xl font-sm transition-colors focus:outline-none focus:ring-0 ${sizeClasses} ${iconSpacing}`;
    }

    private getSizeClasses(): string {
        if (this.showIcon()) {
            return this.size === 'sm'
                ? 'px-3 py-2 text-sm rounded-lg shadow-md hover:scale-[1.01] transition-all duration-300'
                : 'px-4 py-4 text-lg rounded-2xl shadow-lg hover:scale-[1.02] transition-all duration-300 font-bold';
        }
        return 'px-3 py-2';
    }

    ngAfterContentInit() {
        if (this.icon) {
            this.icon.size = this.size;
        }
    }

    get variantClasses(): string {
        const cleanColor = this.sanitizeColor(this.color);
        const color3 = cleanColor + '3';

        switch (this.variant) {
            case 'basic':
                return `hover:bg-${cleanColor} hover:text-white`;
            case 'raised':
                return `bg-${this.color} text-white font-semibold ${this.showIcon() ? 'hover:bg-' + cleanColor + 'Hover' : 'shadow-md hover:bg-' + cleanColor + 'Hover'}`;
            case 'stroked':
                return `border border-surface hover:bg-${cleanColor}-hover-faint`;
            case 'flat':
                return `bg-${color3} text-${cleanColor}Light hover:bg-${cleanColor}-hover-faint`;
            case 'outline':
                return `text-${this.color} border-2 border-${this.color} font-semibold shadow-md hover:text-${cleanColor}Light hover:bg-${cleanColor}-hover-faint`;
            case 'outlineLigth':
                return `border border-${cleanColor}Light text-${cleanColor}Light hover:text-${this.color}Dark`;
            case 'outlineDark':
                return `border border-${cleanColor}Dark hover:bg-${cleanColor}-hover-faint text-${cleanColor}Dark hover:text-${cleanColor}`;
            case 'ghost':
                return `hover:bg-black-faint hover:text-white`;
            default:
                return '';
        }
    }

    get disabledClasses(): string {
        return this.isDisabled ? 'opacity-50 cursor-not-allowed' : '';
    }

    get iconContainerClasses(): string {
        const size = this.size === 'sm' ? 'w-6 h-6' : 'w-8 h-8';
        return `${size} bg-black/20 rounded-full flex items-center justify-center flex-shrink-0`;
    }

    get iconClasses(): string {
        return this.size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
    }

    get classList(): string {
        return [this.baseClasses, this.variantClasses, this.disabledClasses]
            .filter(Boolean)
            .join(' ');
    }

    // Icono por defecto (flecha)
    get defaultIconPath(): string {
        return 'M13 7l5 5m0 0l-5 5m5-5H6';
    }
}
