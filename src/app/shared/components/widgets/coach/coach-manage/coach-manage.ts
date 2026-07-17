import {
    Component,
    computed,
    effect,
    inject,
    input,
    OnInit,
    signal,
} from '@angular/core';
import { CoachService } from '../../../../../core/services/coach/coach.service';
import { ExercisesService } from '../../../../../core/services/exercises/exercises.service';
import { DateService } from '../../../../../core/services/date.service';
import {
    ExercisePerformanceVM,
    LocalDate,
    TrackingVM,
    WorkoutSessionVM,
} from '../../../../interfaces/tracking.interface';
import { ExerciseCategory } from '../../../../interfaces/exercise.interface';
import { CoachNavigatorWeek } from '../coach-navigator-week/coach-navigator-week';
import { CoachShowWorkout } from '../coach-show-workout/coach-show-workout';
import { Loading } from '../../../ui/loading/loading';

interface PlanDay {
    order: number;
    isRest: boolean;
    focus?: string;
    exercises: {
        name: string;
        sets: number;
        reps: string;
        rpe?: number;
        restSeconds?: number;
        notes?: string;
    }[];
}

interface PlanWeek {
    weekNumber: number;
    days: PlanDay[];
}

interface PlanRawResponse {
    title?: string;
    focus?: string;
    durationWeeks?: number;
    daysPerWeek?: number;
    weeks: PlanWeek[];
}

interface PlanData {
    id: string;
    startDate?: string;
    aiSnapshot?: {
        rawResponse?: PlanRawResponse | string;
    };
}

@Component({
    selector: 'app-coach-manage',
    imports: [CoachNavigatorWeek, CoachShowWorkout, Loading],
    templateUrl: './coach-manage.html',
    styles: ``,
})
export class CoachManage implements OnInit {
    planId = input.required<string>();

    private coachService = inject(CoachService);
    private exercisesService = inject(ExercisesService);
    private dateService = inject(DateService);

    loading = signal(true);
    planData = signal<PlanData | null>(null);
    trackingVM = signal<TrackingVM | null>(null);
    selectedDate = signal<LocalDate | null>(null);
    selectedWorkout = signal<WorkoutSessionVM | null>(null);

    exercisesSelectedOrdered = computed(() => {
        const workout = this.selectedWorkout();
        if (!workout || !workout.exercises.length) return [];

        return Object.entries(
            workout.exercises
                .sort((a, b) => a.name.localeCompare(b.name))
                .reduce(
                    (acc, item) => {
                        if (!acc[item.category]) {
                            acc[item.category] = [];
                        }
                        acc[item.category].push(item);
                        return acc;
                    },
                    {} as Record<string, ExercisePerformanceVM[]>,
                ),
        );
    });

    constructor() {
        effect(() => {
            const id = this.planId();
            if (id) {
                this.loadPlan(id);
            }
        });
    }

    ngOnInit() {
        this.exercisesService.getExercises().subscribe();
    }

    private loadPlan(id: string) {
        this.loading.set(true);
        this.coachService.getPlanTrackingById(id).subscribe({
            next: (data) => {
                this.planData.set(data);
                this.buildTrackingVM(data as PlanData);
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
            },
        });
    }

    private buildTrackingVM(plan: PlanData) {
        if (!plan) return;

        const rawResponse: PlanRawResponse | string | undefined = plan.aiSnapshot?.rawResponse;
        if (!rawResponse) return;

        const parsed: PlanRawResponse =
            typeof rawResponse === 'string' ? JSON.parse(rawResponse) : rawResponse;

        const startDate = plan.startDate || this.dateService.todayLocalDate();
        const firstWeek = parsed.weeks?.[0];
        if (!firstWeek) return;

        const exercisesMap = new Map<string, Exercise>();
        for (const ex of this.exercisesService.exercises()) {
            exercisesMap.set(ex.name.toLowerCase().trim(), ex);
        }

        const trainingDays = firstWeek.days.filter((d) => !d.isRest);
        const workouts: WorkoutSessionVM[] = [];

        for (let i = 0; i < 7; i++) {
            const dayDate = this.dateService.addDaysToLocalDate(startDate, i);
            const planDay = trainingDays[i];

            if (planDay) {
                const exercises: ExercisePerformanceVM[] = planDay.exercises.map((ex) => {
                    const found = exercisesMap.get(ex.name.toLowerCase().trim());
                    const repsNumber = this.parseReps(ex.reps);

                    return {
                        exerciseId: found?.id || `plan-${ex.name.toLowerCase().replace(/\s/g, '-')}`,
                        name: ex.name,
                        series: ex.sets,
                        category: found?.category || this.guessCategory(ex.name),
                        sets: Array.from({ length: ex.sets }, () => ({
                            reps: repsNumber,
                            weights: 0,
                        })),
                        usesWeight: found?.usesWeight ?? true,
                        notes: ex.notes,
                    };
                });

                workouts.push({
                    date: dayDate,
                    exercises,
                    status: 'not_started',
                    notes: planDay.focus,
                });
            } else {
                workouts.push({
                    date: dayDate,
                    exercises: [],
                    status: 'rest',
                });
            }
        }

        const tracking: TrackingVM = {
            id: plan.id,
            userId: '',
            startDate,
            endDate: this.dateService.addDaysToLocalDate(startDate, 6),
            workouts,
            planId: plan.id,
            completed: false,
        };

        this.trackingVM.set(tracking);

        if (workouts.length > 0) {
            this.selectedDate.set(workouts[0].date);
            this.selectedWorkout.set(workouts[0]);
        }
    }

    private parseReps(reps: string): number {
        const match = reps.match(/^(\d+)/);
        return match ? parseInt(match[1], 10) : 10;
    }

    private guessCategory(name: string): ExerciseCategory {
        const lower = name.toLowerCase();
        if (lower.includes('press') || lower.includes('banca') || lower.includes('pecho'))
            return ExerciseCategory.CHEST;
        if (lower.includes('remo') || lower.includes('dominada') || lower.includes('espalda'))
            return ExerciseCategory.BACK;
        if (
            lower.includes('sentadilla') ||
            lower.includes('pierna') ||
            lower.includes('prensa') ||
            lower.includes('extensiones de pierna')
        )
            return ExerciseCategory.LEGS;
        if (lower.includes('curl') || lower.includes('bíceps') || lower.includes('biceps'))
            return ExerciseCategory.BICEPS;
        if (lower.includes('tríceps') || lower.includes('triceps') || lower.includes('fondos'))
            return ExerciseCategory.TRICEPS;
        if (lower.includes('hombro') || lower.includes('elevacion')) return ExerciseCategory.SHOULDERS;
        if (lower.includes('plancha') || lower.includes('russian') || lower.includes('core'))
            return ExerciseCategory.CORE;
        return ExerciseCategory.CHEST;
    }

    onDaySelected(workout: WorkoutSessionVM | null) {
        this.selectedWorkout.set(workout);
    }
}

interface Exercise {
    id?: string;
    name: string;
    category: ExerciseCategory;
    usesWeight: boolean;
}
