import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth/auth.service';
import { TrackingActiveComponent } from '../../shared/components/widgets/tracking/tracking-week/tracking-active/tracking-active';
import { ExerciseCategory } from '../../shared/interfaces/exercise.interface';
import { TrackingVM } from '../../shared/interfaces/tracking.interface';
import { RoutineDay } from '../../shared/interfaces/routines.interface';

@Component({
    selector: 'app-user',
    imports: [CommonModule, TrackingActiveComponent],
    standalone: true,
    templateUrl: './user.html',
    styleUrl: './user.css',
})
export class User {
    private authService = inject(AuthService);

    user = this.authService.user;

    // ── Hardcoded mock history data ──────────────────────────────────────────

    weeklyTrackings: TrackingVM[] = [
        {
            id: '1',
            userId: 'u1',
            startDate: new Date('2025-02-03'),
            endDate: new Date('2025-02-09'),
            completed: true,
            planId: 'plan-1',
        },
        {
            id: '2',
            userId: 'u1',
            startDate: new Date('2025-02-10'),
            endDate: new Date('2025-02-16'),
            completed: true,
            planId: 'plan-1',
        },
        {
            id: '3',
            userId: 'u1',
            startDate: new Date('2025-02-17'),
            endDate: new Date('2025-02-23'),
            completed: false,
            planId: 'plan-2',
        },
    ];

    routinesUsed: RoutineDay[] = [
        {
            id: 'r1',
            title: 'Push Day',
            kind: 'WORKOUT',
            type: [ExerciseCategory.CHEST, ExerciseCategory.SHOULDERS, ExerciseCategory.TRICEPS],
        },
        {
            id: 'r2',
            title: 'Pull Day',
            kind: 'WORKOUT',
            type: [ExerciseCategory.BACK, ExerciseCategory.BICEPS],
        },
        {
            id: 'r3',
            title: 'Leg Day',
            kind: 'WORKOUT',
            type: [ExerciseCategory.LEGS],
        },
        {
            id: 'r4',
            title: 'Core & Cardio',
            kind: 'WORKOUT',
            type: [ExerciseCategory.CORE, ExerciseCategory.CARDIO],
        },
    ];

    exercisesUsed = [
        { name: 'Press de banca', category: ExerciseCategory.CHEST, usesWeight: true },
        { name: 'Dominadas', category: ExerciseCategory.BACK, usesWeight: false },
        { name: 'Sentadilla', category: ExerciseCategory.LEGS, usesWeight: true },
        { name: 'Press militar', category: ExerciseCategory.SHOULDERS, usesWeight: true },
        { name: 'Curl de bíceps', category: ExerciseCategory.BICEPS, usesWeight: true },
        { name: 'Plancha', category: ExerciseCategory.CORE, usesWeight: false },
    ];

    get completedWeeks(): number {
        return this.weeklyTrackings.filter((t) => t.completed).length;
    }

    get totalWeeks(): number {
        return this.weeklyTrackings.length;
    }

    // Hardcoded total weeks done (as instructed)
    totalWeeksDoneHardcoded = 8;

    trackByFn(_index: number, item: any) {
        return item.id ?? item.name;
    }

    categoryLabel(category: ExerciseCategory): string {
        const map: Record<ExerciseCategory, string> = {
            [ExerciseCategory.CHEST]: 'Pecho',
            [ExerciseCategory.BACK]: 'Espalda',
            [ExerciseCategory.LEGS]: 'Piernas',
            [ExerciseCategory.LEGS_FRONT]: 'Cuádriceps',
            [ExerciseCategory.LEGS_POSTERIOR]: 'Isquiotibiales',
            [ExerciseCategory.BICEPS]: 'Bíceps',
            [ExerciseCategory.TRICEPS]: 'Tríceps',
            [ExerciseCategory.SHOULDERS]: 'Hombros',
            [ExerciseCategory.CORE]: 'Core',
            [ExerciseCategory.CARDIO]: 'Cardio',
        };
        return map[category] ?? category;
    }

    formatDate(date: Date): string {
        return new Intl.DateTimeFormat('es-AR', {
            day: '2-digit',
            month: 'short',
        }).format(date);
    }
}
