import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { ExerciseCategory } from '../../../../interfaces/exercise.interface';
import { LucideAngularModule, BicepsFlexed } from 'lucide-angular';

export interface RoutineUsedVM {
    id: string;
    title: string;
    kind: string;
    type: ExerciseCategory[];
}

@Component({
    selector: 'app-routines-used',
    imports: [CommonModule, LucideAngularModule],
    standalone: true,
    templateUrl: './routines-used.html',
})
export class RoutinesUsed {
    routines = input.required<RoutineUsedVM[]>();

    readonly BicepsFlexedIcon = BicepsFlexed;

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
}
