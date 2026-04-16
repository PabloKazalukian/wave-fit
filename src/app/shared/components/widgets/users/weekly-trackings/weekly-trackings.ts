import { CommonModule } from '@angular/common';
import { Component, inject, input, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable, map } from 'rxjs';
import { LucideAngularModule, Trophy, ChevronRight } from 'lucide-angular';
import { TrackingListState } from '../../../../../core/services/trackings/tracking-list.state';

interface StatsVM {
    completed: number;
    total: number;
}

@Component({
    selector: 'app-weekly-trackings',
    imports: [CommonModule, RouterLink, LucideAngularModule],
    standalone: true,
    templateUrl: './weekly-trackings.html',
})
export class WeeklyTrackings {
    private facade = inject(TrackingListState);

    limit = input(0);

    trackings = this.facade.trackings$;
    stats = this.facade.getStats();

    readonly TrophyIcon = Trophy;
    readonly ChevronRightIcon = ChevronRight;

    formatDate(date: Date): string {
        return new Intl.DateTimeFormat('es-AR', {
            day: '2-digit',
            month: 'short',
        }).format(new Date(date));
    }
}
