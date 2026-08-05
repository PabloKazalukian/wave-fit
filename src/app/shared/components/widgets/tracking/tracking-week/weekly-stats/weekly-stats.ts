import { Component, computed, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    LucideAngularModule,
    LucideIconData,
    BarChart3,
    Dumbbell,
    Flame,
    Trophy,
    Target,
    Medal,
    ChevronLeft,
    ChevronRight,
} from 'lucide-angular';
import { ExerciseCategory } from '../../../../../interfaces/exercise.interface';
import {
    StatusWorkoutSession,
    StatusWorkoutSessionEnum,
    TrackingVM,
    WorkoutSessionVM,
} from '../../../../../interfaces/tracking.interface';
import {
    ExtraSession,
    ExtraSessionCategory,
} from '../../../../../interfaces/extra-session.interface';
import { ExtraSessionApi } from '../../../../../../core/services/extra-session/api/extra-session.api';
import { UserProfileService } from '../../../../../../core/services/user/user-profile.service';
import { ExerciseCategoryPipe } from '../../../../../pipes/exercise-category.pipe';

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

const MUSCLE_GROUPS: { label: string; categories: ExerciseCategory[] }[] = [
    { label: 'Pecho', categories: [ExerciseCategory.CHEST] },
    { label: 'Espalda', categories: [ExerciseCategory.BACK] },
    {
        label: 'Piernas',
        categories: [
            ExerciseCategory.LEGS,
            ExerciseCategory.LEGS_FRONT,
            ExerciseCategory.LEGS_POSTERIOR,
        ],
    },
    {
        label: 'Brazos',
        categories: [ExerciseCategory.TRICEPS, ExerciseCategory.SHOULDERS, ExerciseCategory.BICEPS],
    },
    { label: 'Core', categories: [ExerciseCategory.CORE] },
];

interface WeeklyStatsRow {
    label: string;
    value: string;
}

interface WeeklyStatsSection {
    title: string;
    icon: LucideIconData;
    rows: WeeklyStatsRow[];
}

interface SessionExerciseSummary {
    name: string;
    category?: ExerciseCategory;
    totalSeries: number;
    totalVolume: number;
    maxSetWeight: number;
}

interface SessionSummary {
    date: string;
    status: StatusWorkoutSession;
    exercisesCount: number;
    totalSeries: number;
    totalVolume: number;
    hasWeight: boolean;
    hasBodyweight: boolean;
    categories: Set<ExerciseCategory>;
    exercises: SessionExerciseSummary[];
}

@Component({
    selector: 'app-weekly-stats',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    templateUrl: './weekly-stats.html',
    styles: ``,
})
export class WeeklyStats {
    readonly ChevronLeftIcon = ChevronLeft;
    readonly ChevronRightIcon = ChevronRight;

    tracking = input<TrackingVM | null>(null);

    private userProfileSvc = inject(UserProfileService);
    private extraApi = inject(ExtraSessionApi);
    private destroyRef = inject(DestroyRef);
    private categoryPipe = new ExerciseCategoryPipe();

    extraSessions = signal<ExtraSession[]>([]);

    sections = computed<WeeklyStatsSection[]>(() => {
        const tracking = this.tracking();
        const summaries = tracking ? this.buildSummaries(tracking.workouts ?? []) : [];

        if (!tracking || summaries.length === 0) {
            return [
                {
                    title: 'Estadísticas Generales',
                    icon: BarChart3,
                    rows: [{ label: 'Sin datos esta semana', value: '--' }],
                },
            ];
        }

        const weightKg = this.userProfileSvc.userProfile()?.weightKg || DEFAULT_WEIGHT_KG;

        return [
            this.buildGeneralSection(tracking, summaries),
            this.buildExercisesSection(summaries),
            this.buildRecordsSection(summaries, this.extraSessions(), weightKg),
            this.buildTopExercisesSection(summaries),
            this.buildMuscleGroupSection(summaries),
            this.buildCaloriesSection(summaries, this.extraSessions(), weightKg),
        ];
    });

    currentSlide = signal(0);

    constructor() {
        const interval = setInterval(() => this.next(), 10000);
        this.destroyRef.onDestroy(() => clearInterval(interval));

        effect(() => {
            const tracking = this.tracking();
            const ids = (tracking?.workouts ?? []).flatMap((w) => w.extras ?? []);

            if (!ids.length) {
                this.extraSessions.set([]);
                return;
            }

            this.extraApi.getByIds(ids).subscribe({
                next: (sessions) => this.extraSessions.set(sessions),
                error: () => this.extraSessions.set([]),
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

    private buildSummaries(workouts: WorkoutSessionVM[]): SessionSummary[] {
        return workouts.map((workout) => {
            let totalVolume = 0;
            let totalSeries = 0;
            const categories = new Set<ExerciseCategory>();
            let hasWeight = false;
            let hasBodyweight = false;
            const exercises: SessionExerciseSummary[] = [];

            for (const exercise of workout.exercises) {
                let exerciseVolume = 0;
                let maxSetWeight = 0;
                const category = exercise.category
                    ? (exercise.category.toLowerCase() as ExerciseCategory)
                    : undefined;

                totalSeries += exercise.series;
                if (category) categories.add(category);
                if (exercise.usesWeight) {
                    hasWeight = true;
                } else {
                    hasBodyweight = true;
                }
                for (const set of exercise.sets ?? []) {
                    const setVolume = (set.weights ?? 0) * (set.reps ?? 0);
                    exerciseVolume += setVolume;
                    totalVolume += setVolume;
                    if ((set.weights ?? 0) > maxSetWeight) maxSetWeight = set.weights ?? 0;
                }

                exercises.push({
                    name: exercise.name,
                    category,
                    totalSeries: exercise.series,
                    totalVolume: exerciseVolume,
                    maxSetWeight,
                });
            }

            return {
                date: workout.date,
                status: workout.status,
                exercisesCount: workout.exercises.length,
                totalSeries,
                totalVolume,
                hasWeight,
                hasBodyweight,
                categories,
                exercises,
            };
        });
    }

    private buildGeneralSection(
        tracking: TrackingVM,
        summaries: SessionSummary[],
    ): WeeklyStatsSection {
        const completed = summaries.filter(
            (s) => s.status === StatusWorkoutSessionEnum.COMPLETE,
        ).length;
        const rests = summaries.filter((s) => s.status === StatusWorkoutSessionEnum.REST).length;
        const notAssigned = summaries.filter(
            (s) => s.status === StatusWorkoutSessionEnum.NOT_STARTED,
        ).length;
        const totalExercises = summaries.reduce((acc, s) => acc + s.exercisesCount, 0);

        const planIds = new Set<string>();
        for (const workout of tracking.workouts ?? []) {
            if (workout.planId) planIds.add(workout.planId);
        }
        if (tracking.planId) planIds.add(tracking.planId);

        return {
            title: 'Estadísticas Generales',
            icon: BarChart3,
            rows: [
                { label: 'Días completados', value: String(completed) },
                { label: 'Descansos', value: String(rests) },
                { label: 'Ejercicios totales', value: String(totalExercises) },
                { label: 'Días sin asignar', value: String(notAssigned) },
                { label: 'Rutinas usadas', value: String(planIds.size) },
            ],
        };
    }

    private buildExercisesSection(summaries: SessionSummary[]): WeeklyStatsSection {
        const totalVolume = Math.round(summaries.reduce((acc, s) => acc + s.totalVolume, 0));
        const trainedDays = summaries.filter((s) => s.exercisesCount > 0).length;
        const averageVolumePerDay = trainedDays > 0 ? Math.round(totalVolume / trainedDays) : 0;

        const groups = new Set<ExerciseCategory>();
        for (const s of summaries) {
            for (const c of s.categories) groups.add(c);
        }
        const groupsLabel = [...groups].map((c) => this.categoryPipe.transform(c)).join(', ');

        const heaviestDay = summaries.reduce<SessionSummary | null>(
            (max, s) => (s.totalVolume > (max?.totalVolume ?? 0) ? s : max),
            null,
        );
        const heaviestValue =
            heaviestDay && heaviestDay.totalVolume > 0
                ? `${this.formatDate(heaviestDay.date)} · ${Math.round(heaviestDay.totalVolume)} kg`
                : '--';

        return {
            title: 'Ejercicios Semanales',
            icon: Dumbbell,
            rows: [
                { label: 'Peso levantado', value: `${totalVolume} kg` },
                {
                    label: 'Peso levantado promedio por día',
                    value: `${averageVolumePerDay} kg`,
                },
                { label: 'Mayor peso en un día', value: heaviestValue },
                { label: 'Grupos trabajados', value: groupsLabel || '--' },
            ],
        };
    }

    private buildRecordsSection(
        summaries: SessionSummary[],
        extraSessions: ExtraSession[],
        weightKg: number,
    ): WeeklyStatsSection {
        let bestSetWeight = 0;
        let bestExerciseName = '';
        for (const s of summaries) {
            for (const ex of s.exercises) {
                if (ex.maxSetWeight > bestSetWeight) {
                    bestSetWeight = ex.maxSetWeight;
                    bestExerciseName = ex.name;
                }
            }
        }
        const bestPrValue =
            bestSetWeight > 0 ? `${bestExerciseName}: ${Math.round(bestSetWeight)} kg` : '--';

        const bestExtraCalories = extraSessions.reduce(
            (max, s) => Math.max(max, s.calories ?? this.estimateExtraCalories(s, weightKg)),
            0,
        );

        const streak = this.maxConsecutiveDays(summaries);

        return {
            title: 'Records',
            icon: Trophy,
            rows: [
                { label: 'Mejor marca de ejercicio', value: bestPrValue },
                {
                    label: 'Mejor marca de calorías extra',
                    value: bestExtraCalories > 0 ? `${bestExtraCalories} kcal` : '--',
                },
                { label: 'Racha máxima de días consecutivos', value: String(streak) },
            ],
        };
    }

    private buildTopExercisesSection(summaries: SessionSummary[]): WeeklyStatsSection {
        const rows = this.topExercises(summaries).map((ex, i) => ({
            label: `${i + 1}. ${ex.name}`,
            value: `${Math.round(ex.volume)} kg · ${ex.series} series`,
        }));

        return {
            title: 'Top 5 Ejercicios',
            icon: Medal,
            rows,
        };
    }

    private buildMuscleGroupSection(summaries: SessionSummary[]): WeeklyStatsSection {
        const rows = MUSCLE_GROUPS.map((group) => {
            const volume = summaries.reduce(
                (acc, s) =>
                    acc +
                    s.exercises.reduce(
                        (a, ex) =>
                            a +
                            (ex.category && group.categories.includes(ex.category)
                                ? ex.totalVolume
                                : 0),
                        0,
                    ),
                0,
            );

            return { label: group.label, value: `${Math.round(volume)} kg` };
        });

        return {
            title: 'Por grupo muscular',
            icon: Target,
            rows,
        };
    }

    private topExercises(
        summaries: SessionSummary[],
    ): { name: string; series: number; volume: number }[] {
        const aggregated = new Map<string, { name: string; series: number; volume: number }>();

        for (const s of summaries) {
            for (const ex of s.exercises) {
                const current = aggregated.get(ex.name) ?? {
                    name: ex.name,
                    series: 0,
                    volume: 0,
                };
                current.series += ex.totalSeries;
                current.volume += ex.totalVolume;
                aggregated.set(ex.name, current);
            }
        }

        return [...aggregated.values()]
            .sort((a, b) => b.volume - a.volume || b.series - a.series)
            .slice(0, 5);
    }

    private maxConsecutiveDays(summaries: SessionSummary[]): number {
        const dates = summaries
            .filter((s) => s.exercisesCount > 0)
            .map((s) => s.date)
            .sort();

        let maxStreak = 0;
        let currentStreak = 0;
        let previousDate: Date | null = null;

        for (const date of dates) {
            const current = new Date(date + 'T00:00:00');
            const isConsecutive =
                previousDate !== null &&
                (current.getTime() - previousDate.getTime()) / 86400000 === 1;

            currentStreak = isConsecutive ? currentStreak + 1 : 1;
            maxStreak = Math.max(maxStreak, currentStreak);
            previousDate = current;
        }

        return maxStreak;
    }

    private buildCaloriesSection(
        summaries: SessionSummary[],
        extraSessions: ExtraSession[],
        weightKg: number,
    ): WeeklyStatsSection {
        const trainedDays = summaries.filter((s) => s.exercisesCount > 0);
        const trainingCalories = trainedDays.reduce(
            (acc, s) => acc + this.sessionCalories(s, weightKg),
            0,
        );

        const extraCalories = extraSessions.reduce(
            (acc, s) => acc + (s.calories ?? this.estimateExtraCalories(s, weightKg)),
            0,
        );

        const totalConsumed = trainingCalories + extraCalories;
        const averagePerDay =
            trainedDays.length > 0 ? Math.round(totalConsumed / trainedDays.length) : 0;

        return {
            title: 'Calorías Consumidas',
            icon: Flame,
            rows: [
                { label: 'Calorías consumidas', value: `${trainingCalories} kcal` },
                { label: 'Extra calorías', value: `${extraCalories} kcal` },
                { label: 'Total consumido', value: `${totalConsumed} kcal` },
                { label: 'Promedio por día', value: `${averagePerDay} kcal` },
            ],
        };
    }

    private sessionCalories(summary: SessionSummary, weightKg: number): number {
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

    private formatDate(date: string): string {
        return date.split('-').reverse().join('/');
    }
}
