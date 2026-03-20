import { Component, inject } from '@angular/core';
import { TrackingListState } from '../../../core/services/trackings/tracking-list.state';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-stats',
    imports: [CommonModule],
    template: `
        <div class="container px-4 py-8 max-w-lg mx-auto">
            <h2 class="text-2xl font-bold text-text1 mb-6">Estadísticas</h2>
            @if (stats$ | async; as stats) {
                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-background2 border-2 border-background4 rounded-xl p-4">
                        <p class="text-sm text-text2">Total Semanas</p>
                        <p class="text-3xl font-bold text-primary">{{ stats.total }}</p>
                    </div>
                    <div class="bg-background2 border-2 border-background4 rounded-xl p-4">
                        <p class="text-sm text-text2">Completadas</p>
                        <p class="text-3xl font-bold text-success">{{ stats.completed }}</p>
                    </div>
                </div>
            }
        </div>
    `,
    standalone: true,
})
export class Stats {
    private facade = inject(TrackingListState);
    stats$ = this.facade.getStats();
}
