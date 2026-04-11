import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { ExtraSessionService } from '../../../../../core/services/extra-session/extra-session.service';
import { ExtraSessionCard } from './extra-session-card/extra-session-card';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Loading } from '../../../ui/loading/loading';
import { delay } from 'rxjs';

@Component({
    selector: 'app-extra-session-content',
    standalone: true,
    imports: [ExtraSessionCard, Loading],
    templateUrl: './extra-session-content.html',
    styles: ``,
})
export class ExtraSessionContent implements OnInit {
    service = inject(ExtraSessionService);
    destroyRef = inject(DestroyRef);

    catalog = toSignal(this.service.catalog$, { initialValue: [] });

    loading = signal<boolean>(false);

    readonly extraSessions = this.service.extraSessions;

    ngOnInit(): void {
        // this.service.findAll().subscribe({
        //     error: (err) => console.error(err),
        // });
    }

    deleteExtraSession(id: string) {
        this.loading.set(true);
        this.service
            .remove(id)
            .pipe(
                delay(1000), // ⏱️ demora en ms
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe({
                error: (err) => console.error(err),
                complete: () => this.loading.set(false),
            });
    }

    updateExtraSession(data: {
        id: string;
        duration: number;
        intensityLevel: number;
        calories?: number;
    }) {
        this.service
            .update({
                id: data.id,
                duration: data.duration,
                intensityLevel: data.intensityLevel,
                calories: data.calories,
            })
            .subscribe({
                error: (err) => console.error(err),
            });
    }
}
