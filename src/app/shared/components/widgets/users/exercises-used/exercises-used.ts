import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { ExerciseCategory } from '../../../../interfaces/exercise.interface';
import { LucideAngularModule, Dumbbell, Target } from 'lucide-angular';

export interface ExerciseUsedVM {
    name: string;
    category: ExerciseCategory;
    usesWeight: boolean;
}

@Component({
    selector: 'app-exercises-used',
    imports: [CommonModule, LucideAngularModule],
    standalone: true,
    templateUrl: './exercises-used.html',
})
export class ExercisesUsed {
    exercises = input.required<ExerciseUsedVM[]>();

    readonly DumbbellIcon = Dumbbell;
    readonly TargetIcon = Target;

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
