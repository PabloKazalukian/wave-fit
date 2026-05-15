import { inject, Component } from '@angular/core';
import { TrackingListState } from '../../core/services/trackings/tracking-list.state';
import { parseISO } from 'date-fns';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Trophy, ChevronRight, ChevronDown } from 'lucide-angular';

@Component({
    selector: 'app-trackings',
    imports: [CommonModule, RouterLink, LucideAngularModule],
    templateUrl: './trackings.html',
    standalone: true,
    styles: ``,
})
export class Trackings {
    private facade = inject(TrackingListState);
    trackings$ = this.facade.trackings$;
    hasMore$ = this.facade.hasMore$;
    isLoadingMore$ = this.facade.isLoadingMore$;

    readonly TrophyIcon = Trophy;
    readonly ChevronRightIcon = ChevronRight;
    readonly ChevronDownIcon = ChevronDown;

    formatDate(localDate: string): string {
        return new Intl.DateTimeFormat('es-AR', {
            day: '2-digit',
            month: 'short',
        }).format(parseISO(localDate));
    }

    loadMore(): void {
        this.facade.loadMore();
    }
}
