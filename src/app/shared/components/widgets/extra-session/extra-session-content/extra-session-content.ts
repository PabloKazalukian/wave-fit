import { Component, inject, OnInit } from '@angular/core';
import { ExtraSessionService } from '../../../../../core/services/extra-session/extra-session.service';
import { ExtraSessionCard } from './extra-session-card/extra-session-card';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-extra-session-content',
    standalone: true,
    imports: [ExtraSessionCard],
    templateUrl: './extra-session-content.html',
    styles: ``,
})
export class ExtraSessionContent implements OnInit {
    service = inject(ExtraSessionService);

    catalog = toSignal(this.service.catalog$, { initialValue: [] });

    readonly extraSessions = this.service.extraSessions;

    ngOnInit(): void {
        // this.service.findAll().subscribe({
        //     error: (err) => console.error(err),
        // });
    }

    deleteExtraSession(id: string) {
        this.service.remove(id).subscribe({
            error: (err) => console.error(err),
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
