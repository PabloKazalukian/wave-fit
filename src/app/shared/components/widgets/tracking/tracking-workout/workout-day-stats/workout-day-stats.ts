import {
    Component,
    DestroyRef,
    computed,
    effect,
    inject,
    input,
    signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import {
    LucideAngularModule,
    LucideIconData,
    Dumbbell,
    Flame,
    ChevronLeft,
    ChevronRight,
} from 'lucide-angular';
import { ExerciseCategory } from '../../../../../interfaces/exercise.interface';
import {
    StatusWorkoutSessionEnum,
    WorkoutSessionVM,
} from '../../../../../interfaces/tracking.interface';
import {
    ExtraSession,
    ExtraSessionCategory,
} from '../../../../../interfaces/extra-session.interface';
import { ExtraSessionApi } from '../../../../../../core/services/extra-session/api/extra-session.api';
import { UserProfileService } from '../../../../../../core/services/user/user-profile.service';
import { ExerciseCategoryPipe } from '../../../../../pipes/exercise-category.pipe';
import { Loading } from '../../../../ui/loading/loading';

const MET_BODYWEIGHT = 3.8;
const MET_STRENGTH = 5.0;
const MET_MIXED = 4.5;
const MINUTES_PER_SET = 2;
const DEFAULT_WEIGHT_KG = 70;

const EXTRA_CATEGORY_MET: Record<ExtraSessionCategory, number> = {
    CARDIO: 7.0,
    STRENGTH: 5.0,
    SPORT: 7.5,
    MIND_BODY: 3.5,
};

interface DayStatsRow {
    label: string;
    value: string;
}

interface DayStatsSection {
    title: string;
    icon: LucideIconData;
    rows: DayStatsRow[];
}

interface DaySummary {
    exercisesCount: number;
    totalSeries: number;
    totalVolume: number;
    hasWeight: boolean;
    hasBodyweight: boolean;
    categories: Set<ExerciseCategory>;
}

@Component({
    selector: 'app-workout-day-stats',
    standalone: true,
    imports: [CommonModule, LucideAngularModule, Loading],
    templateUrl: './workout-day-stats.html',
    styles: ``,
})
export class WorkoutDayStats {
    readonly ChevronLeftIcon = ChevronLeft;
    readonly ChevronRightIcon = ChevronRight;

    workout = input<WorkoutSessionVM | null>(null);

    private userProfileSvc = inject(UserProfileService);
    private extraApi = inject(ExtraSessionApi);
    private destroyRef = inject(DestroyRef);
    private categoryPipe = new ExerciseCategoryPipe();
    private pendingSub?: Subscription;
    private requestId = 0;

    isLoading = signal(true);
    currentSlide = signal(0);
    extras = signal<ExtraSession[]>([]);

    sections = computed<DayStatsSection[]>(() => {
        const workout = this.workout();

        if (!workout) {
            return [
                {
                    title: 'Entrenamiento del día',
                    icon: Dumbbell,
                    rows: [{ label: 'Sin datos del día', value: '--' }],
                },
            ];
        }

        const summary = this.buildSummary(workout);
        const weightKg = this.userProfileSvc.userProfile()?.weightKg || DEFAULT_WEIGHT_KG;
        const caloriesSection = this.buildCaloriesSection(summary, this.extras(), weightKg);

        if (workout.status === StatusWorkoutSessionEnum.REST) {
            return [{ ...caloriesSection, title: 'Día de Descanso' }];
        }

        return [this.buildTrainingSection(summary), caloriesSection];
    });

    constructor() {
        this.destroyRef.onDestroy(() => this.pendingSub?.unsubscribe());

        effect(() => {
            const ids = this.workout()?.extras ?? [];
            const id = ++this.requestId;

            this.isLoading.set(true);
            this.currentSlide.set(0);

            if (!ids.length) {
                if (id !== this.requestId) return;
                this.extras.set([]);
                this.isLoading.set(false);
                return;
            }

            this.pendingSub?.unsubscribe();
            this.pendingSub = this.extraApi.getByIds(ids).subscribe({
                next: (sessions) => {
                    if (id !== this.requestId) return;
                    this.extras.set(sessions);
                    this.isLoading.set(false);
                },
                error: () => {
                    if (id !== this.requestId) return;
                    this.extras.set([]);
                    this.isLoading.set(false);
                },
            });
        });
    }

    prev() {
        this.currentSlide.set(
            this.currentSlide() === 0 ? this.sections().length - 1 : this.currentSlide() - 1,
        );
    }

    next() {
        this.currentSlide.set(
            this.currentSlide() === this.sections().length - 1 ? 0 : this.currentSlide() + 1,
        );
    }

    goTo(index: number) {
        this.currentSlide.set(Math.min(Math.max(index, 0), this.sections().length - 1));
    }

    private buildSummary(workout: WorkoutSessionVM): DaySummary {
        let totalVolume = 0;
        let totalSeries = 0;
        let hasWeight = false;
        let hasBodyweight = false;
        const categories = new Set<ExerciseCategory>();

        for (const exercise of workout.exercises ?? []) {
            const category = exercise.category
                ? (exercise.category.toLowerCase() as ExerciseCategory)
                : undefined;

            if (category) categories.add(category);
            if (exercise.usesWeight) {
                hasWeight = true;
            } else {
                hasBodyweight = true;
            }
            for (const set of exercise.sets ?? []) {
                totalVolume += (set.weights ?? 0) * (set.reps ?? 0);
            }
            totalSeries += exercise.series ?? exercise.sets?.length ?? 0;
        }

        return {
            exercisesCount: workout.exercises?.length ?? 0,
            totalSeries,
            totalVolume,
            hasWeight,
            hasBodyweight,
            categories,
        };
    }

    private buildTrainingSection(summary: DaySummary): DayStatsSection {
        const groupsLabel =
            [...summary.categories].map((c) => this.categoryPipe.transform(c)).join(', ') || '--';

        return {
            title: 'Entrenamiento del día',
            icon: Dumbbell,
            rows: [
                { label: 'Peso levantado', value: `${Math.round(summary.totalVolume)} kg` },
                { label: 'Ejercicios', value: String(summary.exercisesCount) },
                { label: 'Grupos trabajados', value: groupsLabel },
            ],
        };
    }

    private buildCaloriesSection(
        summary: DaySummary,
        extraSessions: ExtraSession[],
        weightKg: number,
    ): DayStatsSection {
        const trainingCalories =
            this.workout()?.status === StatusWorkoutSessionEnum.REST
                ? 0
                : this.sessionCalories(summary, weightKg);
        const extraCalories = extraSessions.reduce(
            (acc, s) => acc + (s.calories ?? this.estimateExtraCalories(s, weightKg)),
            0,
        );

        return {
            title: 'Calorías',
            icon: Flame,
            rows: [
                {
                    label: 'Calorías consumidas',
                    value: `${trainingCalories + extraCalories} kcal`,
                },
                { label: 'Calorías extra quemadas', value: `${extraCalories} kcal` },
                { label: 'Tiempo de trabajo', value: this.formatTotalDuration(extraSessions) },
            ],
        };
    }

    private formatTotalDuration(sessions: ExtraSession[]): string {
        const minutes = sessions.reduce((acc, s) => acc + (s.duration ?? 0), 0);
        if (!minutes) return '--';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours} h ${mins} min` : `${mins} min`;
    }

    private sessionCalories(summary: DaySummary, weightKg: number): number {
        const met =
            summary.hasWeight && summary.hasBodyweight
                ? MET_MIXED
                : summary.hasWeight
                  ? MET_STRENGTH
                  : MET_BODYWEIGHT;
        const durationMinutes = summary.totalSeries * MINUTES_PER_SET;
        return Math.round(((met * 3.5 * weightKg) / 200) * durationMinutes);
    }

    private estimateExtraCalories(session: ExtraSession, weightKg: number): number {
        const durationMinutes = session.duration ?? 0;
        const met = EXTRA_CATEGORY_MET[session.category] ?? MET_STRENGTH;
        return Math.round(((met * 3.5 * weightKg) / 200) * durationMinutes);
    }
}
