import { addDays, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import {
    ExercisePerformanceVM,
    LocalDate,
    StatusWorkoutSessionEnum,
    TrackingVM,
    WorkoutSessionVM,
} from '../interfaces/tracking.interface';
import { ExerciseCategory } from '../interfaces/exercise.interface';
import { AiPlanDay, AiPlanExercise, AiPlanResponse, AiPlanWeek } from '../interfaces/ai-plan.interface';

const CATEGORY_KEYWORDS: [string[], ExerciseCategory][] = [
    [['press de banca', 'press inclinado', 'press declinado', 'aperturas', 'fondos de pecho'], ExerciseCategory.CHEST],
    [['remo', 'dominadas', 'jalon', 'pull over', 'peso muerto'], ExerciseCategory.BACK],
    [['sentadilla', 'prensa de piernas', 'zancada', 'hip thrust', 'curl femoral', 'bisagra'], ExerciseCategory.LEGS_POSTERIOR],
    [['extensiones de piernas', 'cuádriceps', 'cuadriceps', 'hack squat'], ExerciseCategory.LEGS_FRONT],
    [['curl de bíceps', 'curl', 'martillo', 'concentrado'], ExerciseCategory.BICEPS],
    [['tríceps', 'triceps', 'extensiones de tríceps', 'fondos', 'press cerrado', 'kickback'], ExerciseCategory.TRICEPS],
    [['elevaciones', 'hombros', 'press de hombros', 'militar', 'face pull', 'encogimientos'], ExerciseCategory.SHOULDERS],
    [['plancha', 'plank', 'russian twist', 'abdominales', 'crunch', 'bicycle', 'hanging', 'core', 'lumbar'], ExerciseCategory.CORE],
    [['correr', 'trote', 'bici', 'cardio', 'salto', 'remo ergómetro'], ExerciseCategory.CARDIO],
];

const BODYWEIGHT_EXERCISES = [
    'plancha', 'plank', 'russian twist', 'abdominales', 'crunch', 'bicycle',
    'hanging', 'dominadas', 'flexiones', 'burpees', 'mountain climbers',
    'jumping jacks', 'sentadilla sin peso', 'zancada sin peso',
];

function hashId(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash + char) | 0;
    }
    return 'ai-' + Math.abs(hash).toString(36);
}

function parseReps(reps: string): number {
    const match = reps.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 10;
}

function detectCategory(exerciseName: string): ExerciseCategory {
    const lower = exerciseName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    for (const [keywords, category] of CATEGORY_KEYWORDS) {
        for (const kw of keywords) {
            const normalized = kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            if (lower.includes(normalized)) return category;
        }
    }
    return ExerciseCategory.CARDIO;
}

function detectUsesWeight(exerciseName: string): boolean {
    const lower = exerciseName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return !BODYWEIGHT_EXERCISES.some((bw) => lower.includes(bw.normalize('NFD').replace(/[\u0300-\u036f]/g, '')));
}

function aiExerciseToVM(exercise: AiPlanExercise): ExercisePerformanceVM {
    const reps = parseReps(exercise.reps);
    return {
        exerciseId: hashId(exercise.name),
        name: exercise.name.trim(),
        series: exercise.sets,
        category: detectCategory(exercise.name),
        sets: Array.from({ length: exercise.sets }, () => ({ reps })),
        usesWeight: detectUsesWeight(exercise.name),
        notes: [
            exercise.rpe ? `RPE: ${exercise.rpe}` : '',
            exercise.restSeconds ? `Descanso: ${exercise.restSeconds}s` : '',
            exercise.notes ?? '',
        ]
            .filter(Boolean)
            .join(' · '),
    };
}

function aiDayToWorkout(day: AiPlanDay, date: LocalDate): WorkoutSessionVM {
    if (day.isRest) {
        return { date, exercises: [], status: StatusWorkoutSessionEnum.REST };
    }
    return {
        date,
        exercises: (day.exercises ?? []).map(aiExerciseToVM),
        status: StatusWorkoutSessionEnum.COMPLETE,
        notes: day.focus,
    };
}

function buildWeekDates(startDate: LocalDate, weekOffset: number): LocalDate[] {
    const base = parseISO(startDate);
    const weekStart = addDays(base, weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
        const d = addDays(weekStart, i);
        return formatInTimeZone(d, Intl.DateTimeFormat().resolvedOptions().timeZone, 'yyyy-MM-dd');
    });
}

function aiWeekToTracking(week: AiPlanWeek, startDate: LocalDate, planTitle: string): TrackingVM {
    const dates = buildWeekDates(startDate, week.weekNumber - 1);
    const workouts: WorkoutSessionVM[] = week.days.map((day, i) =>
        aiDayToWorkout(day, dates[i]),
    );

    const firstDate = dates[0];
    const lastDate = dates[workouts.length - 1] ?? dates[dates.length - 1];

    return {
        id: `ai-week-${week.weekNumber}`,
        userId: 'ai-preview',
        startDate: firstDate,
        endDate: lastDate,
        workouts,
        planId: null,
        notes: planTitle,
        completed: false,
    };
}

export function adaptAiPlanToTrackings(plan: AiPlanResponse, startDate: LocalDate): TrackingVM[] {
    return plan.weeks.map((week) => aiWeekToTracking(week, startDate, plan.title));
}

export function adaptAiPlanWeekToTracking(
    plan: AiPlanResponse,
    weekNumber: number,
    startDate: LocalDate,
): TrackingVM | null {
    const week = plan.weeks.find((w) => w.weekNumber === weekNumber);
    if (!week) return null;
    return aiWeekToTracking(week, startDate, plan.title);
}
