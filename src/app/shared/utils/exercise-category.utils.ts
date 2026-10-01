/**
 * Traducciones de categoría de ejercicio/músculo a español (product language).
 *
 * Tabla única y compartida: la usan el pipe `exerciseCategory` para templates y
 * los wrappers de stats para los VMs, que necesitan traducir en código y no
 * pueden depender de un pipe de Angular.
 */
export const EXERCISE_CATEGORY_TRANSLATIONS: Record<string, string> = {
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

/**
 * Traduce un valor de categoría a su etiqueta en español.
 *
 * Un valor fuera del enum del frontend (por ejemplo `rest`, que solo existe en
 * el backend) no se descarta ni colapsa a 'unknown': se devuelve capitalizado y
 * sin guiones bajos ("Rest"), mientras el valor crudo sigue disponible aparte
 * (Correction 6).
 */
export function translateExerciseCategory(value: string | undefined): string {
    if (!value) return '';

    const lowerValue = value.toLowerCase();
    const known = EXERCISE_CATEGORY_TRANSLATIONS[lowerValue];
    if (known) return known;

    return value
        .replace(/_/g, ' ')
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}
