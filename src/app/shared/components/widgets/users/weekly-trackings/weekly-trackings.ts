import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Trophy, ChevronRight } from 'lucide-angular';
import { TrackingListState } from '../../../../../core/services/trackings/tracking-list.state';
import { parseISO } from 'date-fns';
import { LocalDate } from '../../../../../shared/interfaces/tracking.interface';

@Component({
    selector: 'app-weekly-trackings',
    imports: [CommonModule, RouterLink, LucideAngularModule],
    standalone: true,
    templateUrl: './weekly-trackings.html',
    styles: [
        `
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            .animate-fade-in-up {
                animation: fadeInUp 0.4s ease-out forwards;
                opacity: 0;
            }
        `,
    ],
})
export class WeeklyTrackings {
    private facade = inject(TrackingListState);

    limit = input<number>(5);

    trackings = this.facade.trackings$;
    stats = this.facade.getStats();

    readonly TrophyIcon = Trophy;
    readonly ChevronRightIcon = ChevronRight;

    /** Formatea un LocalDate "yyyy-MM-dd" para display */
    formatDate(localDate: LocalDate): string {
        return new Intl.DateTimeFormat('es-AR', {
            day: '2-digit',
            month: 'short',
        }).format(parseISO(localDate)); // ✅ parseISO es seguro con yyyy-MM-dd
    }
}
