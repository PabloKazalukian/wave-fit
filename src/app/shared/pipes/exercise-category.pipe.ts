import { Pipe, PipeTransform } from '@angular/core';
import { translateExerciseCategory } from '../utils/exercise-category.utils';

@Pipe({
    name: 'exerciseCategory',
    standalone: true,
})
export class ExerciseCategoryPipe implements PipeTransform {
    transform(value: string | undefined): string {
        if (!value || value === undefined) return '';

        if (value.includes(',')) {
            return value
                .split(',')
                .map((v) => v.trim())
                .map((v) => this.transform(v))
                .join('-');
        }

        return translateExerciseCategory(value);
    }
}
