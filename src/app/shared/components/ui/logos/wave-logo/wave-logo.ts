import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-wave-logo',
    standalone: true,
    imports: [CommonModule],
    template: `
        <svg
            xmlns="http://www.w3.org/2000/svg"
            xml:space="preserve"
            [attr.viewBox]="viewBox"
            [attr.width]="width"
            [attr.height]="height"
            [class]="customClass"
        >
            <path
                [attr.fill]="fillColor"
                d="M229 328h508c32 0 60 8 83 34a132 132 0 0 1 29 97v504q2 52-31 90-11 11-23 19l-2 1a95 95 0 0 1-52 11H233q-43 1-73-32c-23-25-29-56-29-91V447q-1-49 29-85l2-2q22-25 53-30l2-1zm-32 40-2 1a78 78 0 0 0-35 48q-3 19-2 38v143l1 123c6 2 16-4 22-7a239 239 0 0 0 76-72l7-9a385 385 0 0 1 94-86 202 202 0 0 1 51-21 155 155 0 0 1 48-5c22 0 46 5 62 22l3 6-1 3-13 3-3 1a102 102 0 0 0-44 26q-25 26-30 63a119 119 0 0 0 23 84c29-1 55-25 74-47l6-6 6-8 11-10 2-3q51-48 117-44l21 6q14 6 24 17l-1 6q-7 3-14 3-19 4-34 19l-2 2q-15 14-19 36a62 62 0 0 0 11 46c15 21 43 32 66 38h2q28 5 58 4l23-1h13q3 2 4-1V460c0-30-2-55-21-77a69 69 0 0 0-52-23h-57l-149-1H240q-22-1-43 9m251 186q-58 5-106 42l-3 3-7 6-3 3-38 39-2 2-16 20-13 15-27 27-3 3a183 183 0 0 1-71 39l-1 213c0 24 3 45 19 62l2 3 2 2q7 8 15 12l2 1c14 8 28 7 43 7h212l161 1h127c22 0 42-5 59-23q24-27 22-67V822l-1-3-10-1h-27q-36 1-71-7l-3-1q-37-10-65-35l-3-2a82 82 0 0 1-27-51 93 93 0 0 1 32-78v-2c-31 1-59 19-81 41l-3 3-14 15-20 20q-22 19-48 31v5c28 26 69 40 104 48l3 1 3 1 7 3q2 5 0 10c-9 8-27 5-38 5l-24-6c-46-14-95-48-120-95q-6-9-9-20l-1-2c-8-25-8-60 1-85l1-3a130 130 0 0 1 41-57z"
                transform="translate(-35 -87)scale(.26458)"
            />

            <!-- Degradados animados -->
            <defs *ngIf="colorType === 'gradient-animated'">
                <linearGradient [attr.id]="gradientId" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" [attr.style.stop-color]="gradientColors[0]">
                        <animate
                            attributeName="stop-color"
                            [attr.values]="animationValues"
                            [attr.dur]="animationDuration"
                            repeatCount="indefinite"
                        />
                    </stop>
                    <stop offset="100%" [attr.style.stop-color]="gradientColors[1]">
                        <animate
                            attributeName="stop-color"
                            [attr.values]="animationValuesReverse"
                            [attr.dur]="animationDuration"
                            repeatCount="indefinite"
                        />
                    </stop>
                </linearGradient>
            </defs>

            <!-- Degradado estático -->
            <defs *ngIf="colorType === 'gradient-static'">
                <linearGradient [attr.id]="gradientId" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" [attr.style.stop-color]="gradientColors[0]" />
                    <stop offset="100%" [attr.style.stop-color]="gradientColors[1]" />
                </linearGradient>
            </defs>
        </svg>
    `,
    styles: [
        `
            :host {
                display: inline-block;
            }
            svg {
                display: block;
            }
        `,
    ],
})
export class WaveLogoComponent {
    @Input() width: string = '40';
    @Input() height: string = '40';
    @Input() viewBox: string = '0 0 190 200';
    @Input() customClass: string = '';

    // Tipo de color: 'solid', 'gradient-static', 'gradient-animated', 'primary', 'secondary', etc.
    @Input() colorType:
        | 'solid'
        | 'gradient-static'
        | 'gradient-animated'
        | 'primary'
        | 'secondary'
        | 'accent'
        | 'custom' = 'primary';

    // Color sólido personalizado
    @Input() solidColor: string = '#5bc878';

    // Colores del degradado [color1, color2, color3, color4]
    @Input() gradientColors: string[] = ['#4ade80', '#3b82f6', '#8b5cf6'];

    // Duración de la animación en segundos
    @Input() animationDuration: string = '4s';

    // ID único para el degradado
    gradientId = `wave-gradient-${Math.random().toString(36).substr(2, 9)}`;

    get fillColor(): string {
        switch (this.colorType) {
            case 'gradient-static':
            case 'gradient-animated':
                return `url(#${this.gradientId})`;
            case 'primary':
                return 'currentColor'; // Usa el color del texto padre (text-primary)
            case 'secondary':
                return 'currentColor';
            case 'accent':
                return 'currentColor';
            case 'custom':
                return this.solidColor;
            case 'solid':
            default:
                return this.solidColor;
        }
    }

    get animationValues(): string {
        const colors = [...this.gradientColors];
        if (colors.length < 3) colors.push(colors[0]); // Asegurar al menos 3 colores
        colors.push(colors[0]); // Loop
        return colors.join(';');
    }

    get animationValuesReverse(): string {
        const colors = [...this.gradientColors].reverse();
        if (colors.length < 3) colors.push(colors[0]);
        colors.push(colors[0]); // Loop
        return colors.join(';');
    }
}
