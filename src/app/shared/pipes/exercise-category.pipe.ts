import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'exerciseCategory',
    standalone: true,
})
export class ExerciseCategoryPipe implements PipeTransform {
    private readonly translations: Record<string, string> = {
        chest: 'Pecho',
        back: 'Espalda',
        legs: 'Piernas',
        legs_front: 'Piernas frontales',
        legs_posterior: 'Piernas posteriores',
        biceps: 'Bíceps',
        triceps: 'Tríceps',
        shoulders: 'Hombros',
        core: 'Core',
        cardio: 'Cardio',
    };

    transform(value: string): string {
        if (!value) return '';

        // Convertir a minúsculas para buscar en las traducciones
        const lowerValue = value.toLowerCase();

        // Si el valor existe en las traducciones, retornarlo
        if (this.translations[lowerValue]) {
            return this.translations[lowerValue];
        }

        // Fallback: capitalizar primera letra y reemplazar guiones bajos con espacios
        return value
            .replace(/_/g, ' ')
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }
}
