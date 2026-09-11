import { inject, Injectable, signal, computed, effect, DestroyRef } from '@angular/core';
import { ExtraSessionApi } from './api/extra-session.api';
import {
    CreateExtraSessionForm,
    ExtraSession,
    ExtraSessionDisciplineConfig,
    UpdateExtraSessionInput,
} from '../../../shared/interfaces/extra-session.interface';
import { BehaviorSubject, map, Observable, of, switchMap, tap } from 'rxjs';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FormControlsOf } from '../../../shared/utils/form-types.util';
import { PlanTrackingService } from '../trackings/plan-tracking.service';
import { ActiveTrackingService } from '../trackings/active-tracking.service';
import { PlanDayService } from '../day-logs/plan-day.service';
import { WORKOUT_STORE } from '../workouts/workout-store.interface';
import { TrackingVM } from '../../../shared/interfaces/tracking.interface';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';

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
    destroyRef = inject(DestroyRef);

    private api = inject(ExtraSessionApi);
    private trackingService = inject(PlanTrackingService);
    private planDaySvc = inject(PlanDayService);
    private store = inject(WORKOUT_STORE);
    private activeSvc = inject(ActiveTrackingService);

    // State
    private catalogSubject = new BehaviorSubject<ExtraSessionDisciplineConfig[]>([]);
    public catalog$ = this.catalogSubject.asObservable();

    private activeWorkoutSessionsSubject = new BehaviorSubject<ExtraSession[]>([]);
    public activeWorkoutSessions$ = this.activeWorkoutSessionsSubject.asObservable();
    extraSessionIds = computed(() => {
        return this.store.workoutSession()?.extras || [];
    });

    extraSessions = signal<ExtraSession[]>([]);
    extraSessions$ = toSignal(
        toObservable(this.extraSessionIds).pipe(
            switchMap((ids) => (ids.length ? this.api.getByIds(ids) : of([]))),
        ),
        { initialValue: [] },
    );

    constructor() {
        effect(() => {
            const ids = this.extraSessionIds();

            if (!ids.length) {
                this.extraSessions.set([]);
                return;
            }

            this.api.getByIds(ids).subscribe({
                next: (sessions) => {
                    this.extraSessions.set(sessions);
                },
                error: (err) => console.error(err),
            });
        });
    }

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
    }

    loadByWorkoutSession(workoutSessionId: string[]) {
        // this.currentWorkoutSessionId.set(workoutSessionId);
        this.api.getByIds(workoutSessionId).subscribe({
            next: (sessions) => {
                this.activeWorkoutSessionsSubject.next(sessions);
                this.extraSessions.set(sessions);
            },
            error: (err) => console.error('ExtraSessionService error:', err),
        });
    }

    create(input: CreateExtraSessionForm): Observable<TrackingVM | null | undefined> {
        const date = this.store.selectedDate();
        if (!date) return of(null);

        if (this.activeSvc.isDayLogActive()) {
            return this.planDaySvc.updateExtraSession(input).pipe(map(() => null));
        }

        return this.trackingService.updateExtraSession(date, input);
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

    remove(id: string): Observable<TrackingVM | null | undefined> {
        const date = this.store.selectedDate();
        if (!date) return of(null);

        if (this.activeSvc.isDayLogActive()) {
            return this.planDaySvc.removeExtraSession(id) as unknown as Observable<
                TrackingVM | null | undefined
            >;
        }

        return this.trackingService.removeExtraSession(date, id);
    }
}
