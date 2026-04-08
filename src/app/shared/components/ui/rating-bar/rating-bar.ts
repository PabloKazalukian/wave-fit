import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgClass, NgStyle } from '@angular/common';
import { Subscription } from 'rxjs';

export type RatingBarSteps = 3 | 5;
export type RatingBarColor =
    | 'primary'
    | 'secondary'
    | 'confirm'
    | 'accent'
    | 'success'
    | 'error'
    | 'warning'
    | 'text';

const HINTS: Record<RatingBarSteps, string[]> = {
    3: ['Bajo', 'Medio', 'Alto'],
    5: ['Muy bajo', 'Bajo', 'Moderado', 'Alto', 'Muy alto'],
};

const COLOR_CLASSES: Record<RatingBarColor, { border: string; fill: string }> = {
    primary: { border: 'border-primary', fill: 'bg-primary' },
    secondary: { border: 'border-secondary', fill: 'bg-secondary' },
    confirm: { border: 'border-confirm', fill: 'bg-confirm' },
    accent: { border: 'border-accent', fill: 'bg-accent' },
    success: { border: 'border-success', fill: 'bg-success' },
    error: { border: 'border-error', fill: 'bg-error' },
    warning: { border: 'border-warning', fill: 'bg-warning' },
    text: { border: 'border-text', fill: 'bg-text' },
};

export type RatingBarDirection = 'ascending' | 'descending';

// Escala fija: primary → accent → success
type ZoneColor = 'primary' | 'accent' | 'success';

function getColorZone(value: number, steps: RatingBarSteps): ZoneColor {
    if (steps === 3) {
        if (value <= 1) return 'primary';
        if (value <= 2) return 'accent';
        return 'success';
    }
    // steps === 5
    if (value <= 2) return 'primary';
    if (value <= 4) return 'accent';
    return 'success';
}

const ZONE_CLASSES: Record<ZoneColor, { border: string; fill: string }> = {
    primary: { border: 'border-primary', fill: 'bg-primary' },
    accent: { border: 'border-accent', fill: 'bg-accent' },
    success: { border: 'border-confirm', fill: 'bg-confirm' },
};

// Altura mínima de la barra más chica (25%) y máxima (100%)
const MIN_HEIGHT_PCT = 25;

@Component({
    selector: 'app-rating-bar',
    standalone: true,
    imports: [ReactiveFormsModule, NgClass],
    templateUrl: './rating-bar.html',
})
export class RatingBar implements OnInit, OnDestroy {
    @Input() control!: FormControl<number | null>;
    @Input() label = '';
    @Input() name = 'rating';
    @Input() steps: RatingBarSteps = 5;
    @Input() color: RatingBarColor = 'primary';
    @Input() showHint = true;
    @Input() barContainerHeight = 48; // px, alto del contenedor de barras
    @Input() direction: RatingBarDirection = 'ascending';

    segments: number[] = [];
    currentHint = '';

    private sub!: Subscription;

    ngOnInit(): void {
        this.segments = Array.from({ length: this.steps }, (_, i) => i + 1);
        this.updateHint(this.control.value);
        this.sub = this.control.valueChanges.subscribe((v) => this.updateHint(v));
    }

    ngOnDestroy(): void {
        this.sub?.unsubscribe();
    }

    select(value: number): void {
        const next = this.control.value === value ? null : value;
        this.control.setValue(next);
        this.control.markAsTouched();
    }

    /** Devuelve la altura en % para la barra i (1-based), de menor a mayor */
    getBarHeight(index: number): number {
        if (this.control.value === 1) return 100;
        return MIN_HEIGHT_PCT + ((index - 1) / (this.steps - 1)) * (100 - MIN_HEIGHT_PCT);
    }

    // getBarClasses(index: number): Record<string, boolean> {
    //     const { border, fill } = COLOR_CLASSES[this.color];
    //     const filled = (this.control.value ?? 0) >= index;
    //     return {
    //         [border]: true,
    //         [fill]: filled,
    //         'bg-transparent': !filled,
    //     };
    // }

    /** Color activo según valor seleccionado y dirección */
    get activeZone(): ZoneColor | null {
        const v = this.control.value;
        if (!v) return null;
        const effective = this.direction === 'ascending' ? v : this.steps + 1 - v;
        return getColorZone(effective, this.steps);
    }

    getBarClasses(index: number): Record<string, boolean> {
        const filled = (this.control.value ?? 0) >= index;
        const zone = this.activeZone ?? 'primary'; // borde vacío referencia zona 1
        const { border, fill } = ZONE_CLASSES[zone];
        return {
            [border]: true,
            [fill]: filled,
            'bg-transparent': !filled,
        };
    }

    private updateHint(value: number | null): void {
        this.currentHint = value && value > 0 ? (HINTS[this.steps][value - 1] ?? '') : '';
    }
}
