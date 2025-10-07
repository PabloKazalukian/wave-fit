import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-wave-logo-text',
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
            <g [attr.style]="'fill:' + fillColor + ';fill-opacity:1'">
                <!-- Logo de las olas -->
                <path
                    fill="#2ca98a"
                    [attr.fill]="fillColor"
                    d="M268 355h513c33 0 60 8 84 33a131 131 0 0 1 30 98v373l-1 10v120q2 53-30 91-12 11-24 19l-3 1a97 97 0 0 1-52 11H356l-84-1q-43 2-74-32c-23-25-29-56-29-90V474c0-33 7-61 29-85l2-3q23-23 53-30h3zm-32 40-3 1a78 78 0 0 0-35 48q-2 18-2 38v143l1 123c7 2 16-4 22-7a240 240 0 0 0 77-73l8-8q18-24 39-44l3-3a241 241 0 0 1 104-60 158 158 0 0 1 49-5q35-2 62 22 3 2 2 6l-2 3-11 3-3 1a103 103 0 0 0-44 26c-17 15-28 39-31 62q-4 47 21 83l3 2c28-1 55-25 74-47l6-6 7-8 10-10 3-3q51-49 118-44 9 1 17 4l4 2q14 5 24 17l-1 6-14 3a70 70 0 0 0-37 20q-15 16-19 37-4 25 10 43l1 3c15 21 44 32 67 37l2 1q30 5 58 3h37l4-1V486c0-29-2-54-21-77a70 70 0 0 0-53-23H279c-15 0-30 0-43 9m253 186q-58 5-107 42l-3 2-7 7-3 3-39 39-1 2-17 19-13 16-27 27-3 3a185 185 0 0 1-72 39l-1 213c0 24 3 44 19 62l2 3 2 2 15 12 3 1q21 9 43 7h505c23 0 43-4 60-22q24-28 22-67V849l-1-4h-38a268 268 0 0 1-75-9q-36-9-65-34l-3-3a82 82 0 0 1-27-51 92 92 0 0 1 30-76l2-2v-1c-31 1-60 19-82 41l-3 3-14 15-20 19q-22 20-48 32v5a232 232 0 0 0 108 49l3 1q3 0 7 3v10c-9 8-27 5-38 4l-25-5c-46-14-96-48-122-95l-8-20-1-3c-9-25-8-60 1-84l1-3q7-19 18-35l3-3q9-11 20-20z"
                    style="opacity:.925847;fill-opacity:1;stroke-width:1.14984;stroke-dasharray:none"
                    transform="matrix(.27564 0 0 .28443 -47 -101)"
                />

                <!-- Letra W -->
                <path
                    fill="#2ba889"
                    [attr.fill]="fillColor"
                    d="M208 932h19l5 13 1 3v3l1 3 6 23 1 2 1 3v3l2 7h2l1-3 13-46v-3c2-6 2-6 5-8h15q4 5 5 9l1 4 1 3 1 4 3 9 2 10 2 7 1 4 1 3 1 3 1 4h2v-2l5-19 1-4 6-23 1-3 1-3 1-2 2-4h12c6 0 6 0 8 2l-3 15-1 2-6 19-1 3-6 19v3l-3 10-3 9q0 5-5 7h-18q-5-10-8-21l-1-3-10-34-4 10-1 4-11 33-1 3v3l-1 2-2 3h-16q-4-1-6-4l-1-5-1-2-1-3-1-3-18-58-1-4-1-2z"
                    style="opacity:.925847;fill-opacity:1;stroke-width:1.01946;stroke-dasharray:none"
                    transform="matrix(.27564 0 0 .28443 -47 -101)"
                />

                <!-- Letra a -->
                <path
                    [attr.fill]="fillColor"
                    d="m386 930-14 2q-17 6-25 22v5l17 1q3-1 5-4 4-5 11-7 9-2 17 4 5 5 3 12l-8 2h-4l-8 1-24 6q-10 6-13 16-1 11 4 20 9 10 21 13 16 2 28-7l7-4 2 9h17l1-3v-59q-3-14-15-22-9-6-22-7m16 50c1 13 1 13-2 17q-10 9-22 10l-9-3q-5-5-4-12 1-4 5-6 7-4 16-5h2zm165-50-13 2q-17 7-26 23l-1 2q-4 9-4 17v3q0 8 2 14 5 19 22 28 17 7 33 3l2-1 11-5q11-8 13-21h-18l-4 2q-2 3-6 5-9 4-18 1-10-4-13-13l-1-3-2-5h61l3-5v-4l-1-8q-3-18-18-28-10-6-22-7m-1 18 10 2q8 4 11 12v5l-5 1h-36q-1-5 2-10 7-10 18-10"
                    style="opacity:.925847;fill-opacity:1;stroke-width:1.01946;stroke-dasharray:none"
                    transform="matrix(.27564 0 0 .28443 -47 -101)"
                />

                <!-- Letra f -->
                <path
                    fill="#29a888"
                    [attr.fill]="fillColor"
                    d="M724 898h3l9 1v11l-1 4-11 1q-5 1-8 5l-1 7v4h13l2 1h3l4 2v11q0 3-2 5h-5l-2 1h-13v62l-1 3q0 3-2 5h-11l-8-1v-45l-1-24h-6l-4-1-4-1v-10l1-7 6-1h6v-3c1-9 1-16 8-23q11-8 25-7"
                    style="opacity:.925847;fill-opacity:1;stroke-width:1.01946;stroke-dasharray:none"
                    transform="matrix(.27564 0 0 .28443 -47 -101)"
                />

                <!-- Letra v -->
                <path
                    fill="#2ba889"
                    [attr.fill]="fillColor"
                    d="M431 932h18q3 0 5 3l2 4 1 3v3l1 3 14 45 2 7 3-4 1-3 17-53 1-3 3-5h11l8 1q0 10-5 19l-1 4-22 56-1 3-1 2-3 4h-11l-3 1h-5l-4-3-6-13-1-3-22-57-1-4-1-2z"
                    style="opacity:.925847;fill-opacity:1;stroke-width:1.01946;stroke-dasharray:none"
                    transform="matrix(.27564 0 0 .28443 -47 -101)"
                />

                <!-- Letra t -->
                <path
                    fill="#2aa889"
                    [attr.fill]="fillColor"
                    d="M808 909h13l3 1v8l1 3v3l2 7h11l3 1h3l5 2v11q1 3-2 5h-8l-3 1h-8l-3 1v35q-1 7 3 14l11 3 8 1v11l-1 5c-9 3-22 2-30-2q-10-4-13-14l-1-15v-4l-1-27v-5l-1-3-9-1-4-2-1-7v-4l3-5 6-1h6l1-10v-9q0-4 6-3"
                    style="opacity:.925847;fill-opacity:1;stroke-width:1.01946;stroke-dasharray:none"
                    transform="matrix(.27564 0 0 .28443 -47 -101)"
                />

                <!-- Letra i (punto) -->
                <path
                    fill="#29a888"
                    [attr.fill]="fillColor"
                    d="M757 933h13l3 1v24l1 53v2c-1 6-1 6-3 8h-11c-6 0-6 0-8-2l-1-11v-68q-1-9 6-7"
                    style="opacity:.925847;fill-opacity:1;stroke-width:1.01946;stroke-dasharray:none"
                    transform="matrix(.27564 0 0 .28443 -47 -101)"
                />

                <!-- Guión medio -->
                <path
                    fill="#2aa888"
                    [attr.fill]="fillColor"
                    d="M632 966h28c6 0 6 0 9 2v10l-1 7h-37l-8-1v-16q4-3 9-2"
                    style="opacity:.925847;fill-opacity:1;stroke-width:1.01946;stroke-dasharray:none"
                    transform="matrix(.27564 0 0 .28443 -47 -101)"
                />

                <!-- Letra i (punto superior) -->
                <path
                    fill="#2ca889"
                    [attr.fill]="fillColor"
                    d="M769 899q6 3 7 10-1 7-7 11-6 2-11 1-5-2-9-7-1-7 2-13 9-8 18-2"
                    style="opacity:.925847;fill-opacity:1;stroke-width:1.01946;stroke-dasharray:none"
                    transform="matrix(.27564 0 0 .28443 -47 -101)"
                />
            </g>

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
export class WaveLogoTextComponent {
    @Input() width: string = '40';
    @Input() height: string = '40';
    @Input() viewBox: string = '0 0 200 215';
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
