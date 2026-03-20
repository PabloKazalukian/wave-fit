import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TrackingListState } from '../../../core/services/trackings/tracking-list-state.service';
import { CommonModule } from '@angular/common';
import { map, Observable, switchMap, tap } from 'rxjs';
import { LucideAngularModule, ChevronLeft, Calendar, ClipboardList } from 'lucide-angular';
import { TrackingVM } from '../../../shared/interfaces/tracking.interface';

@Component({
    selector: 'app-show',
    imports: [CommonModule, RouterLink, LucideAngularModule],
    templateUrl: './show.html',
    standalone: true,
    styles: ``,
})
export class Show {
    private route = inject(ActivatedRoute);
    private facade = inject(TrackingListState);

    asyncLoaded = false;
    tracking$: Observable<TrackingVM | null> = this.route.params.pipe(
        map((params) => params['id']),
        switchMap((id) => this.facade.getTrackingById(id)),
        tap((params) => console.log(params)),
        tap(() => (this.asyncLoaded = true)),
    );

    readonly ChevronLeftIcon = ChevronLeft;
    readonly CalendarIcon = Calendar;
    readonly ClipboardListIcon = ClipboardList;

    formatDate(date: Date): string {
        return new Intl.DateTimeFormat('es-AR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        }).format(new Date(date));
    }
}
