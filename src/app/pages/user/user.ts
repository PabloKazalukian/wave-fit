import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { parseISO } from 'date-fns';
import { AuthService } from '../../core/services/auth/auth.service';
import { TrackingActiveComponent } from '../../shared/components/widgets/tracking/tracking-week/tracking-active/tracking-active';
import { ExerciseCategory } from '../../shared/interfaces/exercise.interface';
import {
    LucideAngularModule,
    Trophy,
    Award,
    Dumbbell,
    BicepsFlexed,
    Target,
    ChevronRight,
} from 'lucide-angular';
import { TrackingListState } from '../../core/services/trackings/tracking-list.state';
import { WeeklyTrackings } from '../../shared/components/widgets/users/weekly-trackings/weekly-trackings';

@Component({
    selector: 'app-user',
    imports: [CommonModule, TrackingActiveComponent, LucideAngularModule, WeeklyTrackings],
    standalone: true,
    templateUrl: './user.html',
    styleUrl: './user.css',
})
export class User {
    private authService = inject(AuthService);
    private trackingFacade = inject(TrackingListState);

    user = this.authService.user;
    trackings$ = this.trackingFacade.trackings$;
    stats$ = this.trackingFacade.getStats();

    readonly TrophyIcon = Trophy;
    readonly AwardIcon = Award;
    readonly DumbbellIcon = Dumbbell;
    readonly BicepsFlexedIcon = BicepsFlexed;
    readonly TargetIcon = Target;
    readonly ChevronRightIcon = ChevronRight;

    // ── Pre-existing mock data (keeping routines and exercises for now as they are not part of the refactor) ──
    routinesUsed = [
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

    formatDate(localDate: string): string {
        return new Intl.DateTimeFormat('es-AR', {
            day: '2-digit',
            month: 'short',
        }).format(parseISO(localDate)); // ✅ parseISO es seguro con "yyyy-MM-dd"
    }
}
