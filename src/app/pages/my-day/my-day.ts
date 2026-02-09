import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { BtnComponent } from '../../shared/components/ui/btn/btn';
import { RoutineSchedulerComponent } from '../../shared/components/widgets/tracking/routine-scheduler/routine-scheduler';
import { PlanTrackingService } from '../../core/services/trackings/plan-tracking.service';
import { TrackingVM } from '../../shared/interfaces/tracking.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, switchMap, tap } from 'rxjs';
import { AuthService } from '../../core/services/auth/auth.service';

@Component({
    selector: 'app-my-day',
    imports: [BtnComponent, RoutineSchedulerComponent],
    standalone: true,
    templateUrl: './my-day.html',
})
export class MyDay implements OnInit {
    destroyRef = inject(DestroyRef);
    svcTracking = inject(PlanTrackingService);
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
                map(() => this.svcTracking.initTracking(this.userId())),
                switchMap(() => this.svcTracking.trackingPlanVM$),
            )
            .subscribe((tracking) => {
                this.tracking.set(tracking);
                this.routineActivated.set(!tracking);
            });
    }

    createTracking() {
        this.svcTracking.createTracking().subscribe({
            next: (res) => {
                this.routineActivated.set(false);
                if (res) this.tracking.set(res);
                console.log(res);
            },
            error: (err) => {},
        });
    }
}
