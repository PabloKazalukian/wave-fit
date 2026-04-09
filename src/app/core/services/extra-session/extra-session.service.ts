import { inject, Injectable, signal, computed } from '@angular/core';
import { ExtraSessionApi } from './api/extra-session.api';
import {
    CreateExtraSessionForm,
    ExtraSession,
    ExtraSessionDisciplineConfig,
    UpdateExtraSessionInput,
} from '../../../shared/interfaces/extra-session.interface';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FormControlsOf } from '../../../shared/utils/form-types.util';
import { PlanTrackingService } from '../trackings/plan-tracking.service';
import { WorkoutStateService } from '../workouts/workout.state';
import { TrackingVM } from '../../../shared/interfaces/tracking.interface';

export type ExtraSessionFormType = FormControlsOf<IExtraSessionForm>;
export interface IExtraSessionForm {
    category: string;
    discipline: string;
    workoutSessionId: string;
    date: Date;
    duration: number;
    intensityLevel: number;
    calories: number;
    notes: string;
}

@Injectable({ providedIn: 'root' })
export class ExtraSessionService {
    private api = inject(ExtraSessionApi);
    private trackingService = inject(PlanTrackingService);
    private state = inject(WorkoutStateService);

    // State
    private catalogSubject = new BehaviorSubject<ExtraSessionDisciplineConfig[]>([]);
    public catalog$ = this.catalogSubject.asObservable();

    private activeWorkoutSessionsSubject = new BehaviorSubject<ExtraSession[]>([]);
    public activeWorkoutSessions$ = this.activeWorkoutSessionsSubject.asObservable();

    extraSessions = signal<ExtraSession[]>([]);

    currentWorkoutSessionId = signal<string | null>(null);

    extraSessionForm = new FormGroup<ExtraSessionFormType>({
        category: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required, Validators.minLength(3)],
        }),
        discipline: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required, Validators.minLength(3)],
        }),
        workoutSessionId: new FormControl('', { nonNullable: true }),
        date: new FormControl(new Date(), { nonNullable: true }),
        duration: new FormControl(30, { nonNullable: true }),
        intensityLevel: new FormControl(3, { nonNullable: true }),
        calories: new FormControl(0, { nonNullable: true }),
        notes: new FormControl('', { nonNullable: true }),
    });

    loadCatalog() {
        if (this.catalogSubject.value.length === 0) {
            this.api.getCatalog().subscribe({
                next: (catalog) => this.catalogSubject.next(catalog),
                error: (err) => console.error('ExtraSessionService error:', err),
            });
        }
        // this.extraSessionForm = this.initForm();
    }

    loadByWorkoutSession(workoutSessionId: string) {
        this.currentWorkoutSessionId.set(workoutSessionId);
        this.api.getByWorkoutSession(workoutSessionId).subscribe({
            next: (sessions) => {
                this.activeWorkoutSessionsSubject.next(sessions);
                this.extraSessions.set(sessions);
            },
            error: (err) => console.error('ExtraSessionService error:', err),
        });
    }

    create(input: CreateExtraSessionForm): Observable<TrackingVM | null | undefined> {
        if (!this.state.selectedDate()) return of(null);
        return this.trackingService.updateExtraSession(this.state.selectedDate()!, input);
        // return this.api.create(input).pipe(
        //     tap((newSession) => {
        //         const current = this.activeWorkoutSessionsSubject.value;
        //         this.activeWorkoutSessionsSubject.next([...current, newSession]);
        //         this.extraSessions.set([...current, newSession]);
        //     }),
        //     tap(() => this.loadByWorkoutSession(this.currentWorkoutSessionId()!)),
        // );
    }

    update(input: UpdateExtraSessionInput): Observable<ExtraSession | null | undefined> {
        return this.api.update(input).pipe(
            tap((updatedSession) => {
                const current = this.activeWorkoutSessionsSubject.value;
                const updated = current.map((s) =>
                    s.id === updatedSession.id ? updatedSession : s,
                );
                this.activeWorkoutSessionsSubject.next(updated);
                this.extraSessions.set(updated);
            }),
        );
    }

    remove(id: string) {
        return this.api.remove(id).pipe(
            tap((success) => {
                if (success) {
                    const current = this.activeWorkoutSessionsSubject.value;
                    const filtered = current.filter((s) => s.id !== id);
                    this.activeWorkoutSessionsSubject.next(filtered);
                    this.extraSessions.set(filtered);
                }
            }),
        );
    }
}
