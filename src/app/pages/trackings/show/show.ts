import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TrackingListState } from '../../../core/services/trackings/tracking-list.state';
import { CommonModule } from '@angular/common';
import { delay, map, Observable, switchMap, tap } from 'rxjs';
import { LucideAngularModule, ChevronLeft, Calendar, ClipboardList, X } from 'lucide-angular';
import { TrackingVM } from '../../../shared/interfaces/tracking.interface';
import { Router } from '@angular/router';
import { DialogComponent } from '../../../shared/components/ui/dialog/dialog';
import { BtnComponent } from '../../../shared/components/ui/btn/btn';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-show',
    imports: [CommonModule, RouterLink, LucideAngularModule, DialogComponent, BtnComponent],
    templateUrl: './show.html',
    standalone: true,
    styles: ``,
})
export class Show {
    destroyRef = inject(DestroyRef);

    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private facade = inject(TrackingListState);

    showDeleteDialog = signal(false);
    trackingIdToDelete = signal<string | null>(null);

    asyncLoaded = false;
    tracking$: Observable<TrackingVM | null> = this.route.params.pipe(
        map((params) => params['id']),
        switchMap((id) => this.facade.getTrackingById(id)),
        tap(() => (this.asyncLoaded = true)),
    );

    readonly ChevronLeftIcon = ChevronLeft;
    readonly CalendarIcon = Calendar;
    readonly ClipboardListIcon = ClipboardList;
    readonly XIcon = X;

    formatDate(date: string): string {
        return new Intl.DateTimeFormat('es-AR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        }).format(new Date(date));
    }

    removeTracking(id: string) {
        this.trackingIdToDelete.set(id);
        this.showDeleteDialog.set(true);
    }

    confirmDelete() {
        const id = this.trackingIdToDelete();
        if (!id) return;
        this.facade
            .removeTracking(id)
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                tap(() => {
                    this.facade.resetData();
                }),
                delay(200),
            )
            .subscribe((success) => {
                if (success) {
                    this.router.navigate(['..'], { relativeTo: this.route });
                }
                this.showDeleteDialog.set(false);
                this.trackingIdToDelete.set(null);
            });
    }
}
