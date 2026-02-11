import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { BtnComponent } from '../../shared/components/ui/btn/btn';
import { PlanTrackingService } from '../../core/services/trackings/plan-tracking.service';
import { TrackingVM } from '../../shared/interfaces/tracking.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, switchMap, tap } from 'rxjs';
import { AuthService } from '../../core/services/auth/auth.service';
import { TrackingWeekComponent } from '../../shared/components/widgets/tracking/tracking-week/tracking-week';

@Component({
    selector: 'app-my-day',
    imports: [BtnComponent, TrackingWeekComponent],
    standalone: true,
    templateUrl: './my-day.html',
})
export class MyDay implements OnInit {
    destroyRef = inject(DestroyRef);
    trackingSvc = inject(PlanTrackingService);
    authSvc = inject(AuthService);

    routineActivated = signal<boolean>(true);
    tracking = signal<TrackingVM | null>(null);

    userId = signal<string>('');

    ngOnInit() {
        this.authSvc
            .me()
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                tap((user) => {
                    this.userId.set(user?.id ?? '');
                }),
                map(() => this.trackingSvc.initTracking(this.userId())),
                switchMap(() => this.trackingSvc.trackingPlanVM$),
            )
            .subscribe((tracking) => {
                this.tracking.set(tracking);
                this.routineActivated.set(!tracking);
            });
    }

    createTracking() {
        this.trackingSvc.createTracking().subscribe({
            next: (res) => {
                this.routineActivated.set(false);
                if (res) this.tracking.set(res);
                console.log(res);
            },
            error: (err) => {},
        });
    }
}
