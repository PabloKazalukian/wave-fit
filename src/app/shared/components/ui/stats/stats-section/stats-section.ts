import { Component, input, output } from '@angular/core';
import { BtnComponent } from '../../btn/btn';
import { Loading } from '../../loading/loading';
import { formatDateTime } from '../../../../utils/stats-chart.theme';

@Component({
    selector: 'app-stats-section',
    standalone: true,
    imports: [BtnComponent, Loading],
    templateUrl: './stats-section.html',
    styles: [
        `
            :host {
                display: block;
                width: 100%;
            }
        `,
    ],
})
export class StatsSection {
    title = input<string>('');
    loading = input<boolean>(false);
    error = input<string | null>(null);
    empty = input<boolean>(false);
    emptyMessage = input<string>('');
    computedAt = input<string | null>(null);

    /**
     * Refetch con datos ya en pantalla (FR-009). Se dibuja como spinner en el
     * header y **nunca** reemplaza `<ng-content>`: leer el rango anterior
     * mientras entra el nuevo es la experiencia buscada. La precedencia sigue
     * siendo loading → error → empty → contenido, así que un `refreshing` con
     * error muestra la card de error, no el spinner.
     */
    refreshing = input<boolean>(false);

    /**
     * Segunda línea del header. `/stats` usa `computedAt` porque sus datos son un
     * snapshot; `/stats/insights` son queries on demand sin timestamp, así que
     * muestra el rango seleccionado en su lugar (por eso no hay `computedAt`
     * allí, y por eso esta card no inventa una hora de "actualización").
     */
    subtitle = input<string | null>(null);

    retry = output<void>();

    readonly formatDateTime = formatDateTime;
}
