import { DestroyRef, inject, Injectable } from '@angular/core';
import { PlanTrackingService } from './plan-tracking.service';
import { BehaviorSubject, filter, finalize, map, Observable, startWith, Subject, switchMap, tap } from 'rxjs';
import { TrackingVM } from '../../../shared/interfaces/tracking.interface';

@Injectable({
    providedIn: 'root',
})
export class TrackingListState {
    private planTrackingService = inject(PlanTrackingService);

    private readonly _refresh$ = new Subject<void>();
    private readonly _loadMore$ = new Subject<void>();

    private _limit = 5;
    private _offset = 0;
    private _hasMore = true;
    private _isLoadingMore = false;

    // Estado reactivo de la lista
    private _trackingsState = new BehaviorSubject<TrackingVM[] | null>(null);
    readonly trackings$ = this._trackingsState.asObservable();
    readonly hasMore$ = new BehaviorSubject<boolean>(true);
    readonly isLoadingMore$ = new BehaviorSubject<boolean>(false);

    constructor() {
        this._refresh$.pipe(
            startWith(undefined),
            tap(() => {
                this._offset = 0;
                this._hasMore = true;
                this.hasMore$.next(this._hasMore);
                this._trackingsState.next(null);
            }),
            switchMap(() => this.planTrackingService.findAll(this._limit, this._offset)),
        ).subscribe(trackings => {
            if (trackings) {
                if (trackings.length < this._limit) {
                    this._hasMore = false;
                    this.hasMore$.next(this._hasMore);
                }
                this._trackingsState.next(trackings);
            }
        });

        this._loadMore$.pipe(
            filter(() => this._hasMore && !this._isLoadingMore),
            tap(() => {
                this._isLoadingMore = true;
                this.isLoadingMore$.next(true);
                this._offset += this._limit;
            }),
            switchMap(() => this.planTrackingService.findAll(this._limit, this._offset).pipe(
                finalize(() => {
                    this._isLoadingMore = false;
                    this.isLoadingMore$.next(false);
                })
            )),
        ).subscribe(newTrackings => {
            if (newTrackings) {
                if (newTrackings.length < this._limit) {
                    this._hasMore = false;
                    this.hasMore$.next(this._hasMore);
                }
                const current = this._trackingsState.value || [];
                // Evitamos duplicados por si acaso
                const uniqueNewTrackings = newTrackings.filter(nt => !current.some(ct => ct.id === nt.id));
                this._trackingsState.next([...current, ...uniqueNewTrackings]);
            }
        });
    }

    loadMore(): void {
        this._loadMore$.next();
    }

    getTrackingById(id: string): Observable<TrackingVM | null> {
        return this.planTrackingService.findById(id);
    }

    getStats() {
        return this.trackings$.pipe(
            tap((trackings) => console.log(trackings)),
            map((trackings: TrackingVM[] | null) => {
                if (!trackings) return { completed: 0, total: 0 };
                return {
                    completed: trackings.filter((t: TrackingVM) => t.completed).length,
                    total: trackings.length,
                };
            }),
        );
    }

    removeTracking(id: string): Observable<boolean> {
        return this.planTrackingService.removeTracking(id);
    }

    resetData(): void {
        this._refresh$.next();
    }
}
