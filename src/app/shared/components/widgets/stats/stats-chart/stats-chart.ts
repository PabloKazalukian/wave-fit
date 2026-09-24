import { Component, input, computed } from '@angular/core';
import { HighchartsChartComponent } from 'highcharts-angular';
import type { Options } from 'highcharts';

@Component({
    selector: 'app-stats-chart',
    standalone: true,
    imports: [HighchartsChartComponent],
    template: `
        @if (options()) {
            <highcharts-chart [options]="chartOptions()"></highcharts-chart>
        }
    `,
    styles: [
        `
            :host {
                display: block;
                width: 100%;
            }
        `,
    ],
})
export class StatsChart {
    options = input<Options | null>(null);

    chartOptions = computed<Options>(() => this.options() as Options);
}
