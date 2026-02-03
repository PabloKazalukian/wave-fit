import { Component, computed, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-spinner',
    standalone: true,
    imports: [CommonModule],
    template: ` <div class="loader" [style.--spinner-color]="currentColor()"></div> `,
    styles: [
        `
            .loader {
                width: 100%;
                aspect-ratio: 1;
                border-radius: 50%;
                background:
                    radial-gradient(farthest-side, var(--spinner-color) 94%, #0000) top/8px 8px
                        no-repeat,
                    conic-gradient(#0000 30%, var(--spinner-color));
                -webkit-mask: radial-gradient(farthest-side, #0000 calc(100% - 8px), #000 0);
                mask: radial-gradient(farthest-side, #0000 calc(100% - 3px), #000 0);
                animation: spin 1s infinite linear;
                transition: --spinner-color 0.8s ease-in-out;
            }

            @supports (transition: --spinner-color 0.8s) {
                .loader {
                    transition: --spinner-color 0.8s ease-in-out;
                }
            }

            @property --spinner-color {
                syntax: '<color>';
                inherits: false;
                initial-value: #50c878;
            }

            @keyframes spin {
                100% {
                    transform: rotate(1turn);
                }
            }
        `,
    ],
})
export class SpinnerComponent implements OnInit {
    @Input() colors: string[] = ['#50C878', '#ec4899', '#66aaf9'];

    colorIndex = signal<number>(0);

    ngOnInit() {
        // Cambiar color cada 2s para dar tiempo a la transición
        setInterval(() => {
            this.colorIndex.update((p) => (p === this.colors.length - 1 ? 0 : p + 1));
        }, 600);
    }

    currentColor = computed(() => {
        return this.colors[this.colorIndex()];
    });
}
