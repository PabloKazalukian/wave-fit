import { Component, computed, input, output, Signal } from '@angular/core';
import type { Options } from 'highcharts';
import { StatsSection } from '../../../ui/stats/stats-section/stats-section';
import { StatsChart } from '../stats-chart/stats-chart';

/**
 * Una card de `/stats/insights` (FR-024).
 *
 * Envuelve `app-stats-section` y es la unidad que más adelante va a cargar las
 * interacciones por chart (cuáles mostrar, qué tipo) sin que la página tenga que
 * enterarse: acá sólo se proyecta.
 *
 * El reparto `loading` → esqueleto vs `refreshing` → spinner en el header se
 * **deriva** acá, una sola vez, en vez de en cada card de la página (AC-005). Si
 * se pasara el `loading` crudo, una recarga con el chart anterior en pantalla
 * mostraría el esqueleto encima y el usuario perdería el dato viejo justo cuando
 * está mirando la comparación. `empty` sigue siendo un input: depende de los
 * `Options` ya mapeados, que sólo la página tiene.
 */
@Component({
    selector: 'app-stats-insights-card',
    standalone: true,
    imports: [StatsSection, StatsChart],
    templateUrl: './stats-insights-card.html',
    styles: ``,
})
export class StatsInsightsCard {
    title = input<string>('');
    subtitle = input<string | null>(null);
    emptyMessage = input<string>('');
    /** Un signal por chart; los `null` no dibujan nada (se filtran en el `@for`). */
    charts = input.required<readonly Signal<Options | null>[]>();
    /** Bandera cruda de carga en vuelo, tal cual la entrega el state. */
    loading = input<boolean>(false);
    /** Hay payload previo en pantalla para esta sección. */
    hasData = input<boolean>(false);
    /**
     * Input y no derivado: depende de los `Options` ya mapeados, que sólo la
     * página puede ver. `volume` además está vacía sólo si lo están **sus dos**
     * charts, así que el criterio tampoco es del shell.
     */
    empty = input<boolean>(false);
    error = input<string | null>(null);

    retry = output<void>();

    readonly loadingShell = computed(() => this.loading() && !this.hasData());
    readonly refreshing = computed(() => this.loading() && this.hasData());
}
