import { inject, Injectable, signal } from '@angular/core';
import { ExtraSessionApi } from './api/extra-session.api';
import {
    CreateExtraSessionInput,
    ExtraSession,
    ExtraSessionDisciplineConfig,
    UpdateExtraSessionInput,
} from '../../../shared/interfaces/extra-session.interface';
import { BehaviorSubject, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ExtraSessionService {
    private api = inject(ExtraSessionApi);

    // State
    private catalogSubject = new BehaviorSubject<ExtraSessionDisciplineConfig[]>([]);
    public catalog$ = this.catalogSubject.asObservable();

    private activeWorkoutSessionsSubject = new BehaviorSubject<ExtraSession[]>([]);
    public activeWorkoutSessions$ = this.activeWorkoutSessionsSubject.asObservable();

    loadCatalog() {
        if (this.catalogSubject.value.length === 0) {
            this.api.getCatalog().subscribe({
                next: (catalog) => this.catalogSubject.next(catalog),
                error: (err) => console.error('ExtraSessionService error:', err),
            });
        }
    }

    loadByWorkoutSession(workoutSessionId: string) {
        this.api.getByWorkoutSession(workoutSessionId).subscribe({
            next: (sessions) => this.activeWorkoutSessionsSubject.next(sessions),
            error: (err) => console.error('ExtraSessionService error:', err),
        });
    }

    create(input: CreateExtraSessionInput) {
        return this.api.create(input).pipe(
            tap((newSession) => {
                const current = this.activeWorkoutSessionsSubject.value;
                this.activeWorkoutSessionsSubject.next([...current, newSession]);
            }),
        );
    }

    update(input: UpdateExtraSessionInput) {
        return this.api.update(input).pipe(
            tap((updatedSession) => {
                const current = this.activeWorkoutSessionsSubject.value;
                this.activeWorkoutSessionsSubject.next(
                    current.map((s) => (s.id === updatedSession.id ? updatedSession : s)),
                );
            }),
        );
    }

    remove(id: string) {
        return this.api.remove(id).pipe(
            tap((success) => {
                if (success) {
                    const current = this.activeWorkoutSessionsSubject.value;
                    this.activeWorkoutSessionsSubject.next(current.filter((s) => s.id !== id));
                }
            }),
        );
    }
}
