import { Component, input, output } from '@angular/core';
import { BtnComponent } from '../../btn/btn';
import { formatDateTime } from '../../../../utils/stats-chart.theme';

@Component({
    selector: 'app-stats-section',
    standalone: true,
    imports: [BtnComponent],
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

    retry = output<void>();

    readonly formatDateTime = formatDateTime;
}
