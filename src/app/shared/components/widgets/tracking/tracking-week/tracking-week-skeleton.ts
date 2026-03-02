import { Component } from '@angular/core';

@Component({
    selector: 'app-tracking-week-skeleton',
    standalone: true,
    template: `
        <div class="w-full bg-background2 rounded-2xl p-4 flex flex-col gap-4 animate-pulse">
            <!-- Header/Button placeholder -->
            <div class="h-10 bg-background3 rounded-lg w-40"></div>

            <!-- Date placeholder -->
            <div class="h-4 bg-background3 rounded w-32"></div>

            <!-- Navigator days placeholders -->
            <div class="flex justify-between gap-2">
                @for (i of [1, 2, 3, 4, 5, 6, 7]; track i) {
                    <div class="h-12 w-full bg-background3 rounded-xl"></div>
                }
            </div>

            <!-- Content placeholder -->
            <div class="mt-4 flex flex-col gap-2">
                <div class="h-6 bg-background3 rounded w-24 mb-2"></div>
                <div class="h-20 bg-background3 rounded-xl w-full"></div>
            </div>
        </div>
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
export class TrackingWeekSkeletonComponent {}
