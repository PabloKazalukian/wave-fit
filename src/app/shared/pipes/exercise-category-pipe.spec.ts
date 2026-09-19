import { ExerciseCategoryPipe } from './exercise-category.pipe';

describe('ExerciseCategoryPipe (TEST-004)', () => {
    let pipe: ExerciseCategoryPipe;

    beforeEach(() => {
        pipe = new ExerciseCategoryPipe();
    });

    it('normalizes UPPERCASE API values to their lowercase translations', () => {
        expect(pipe.transform('CHEST')).toBe('Pecho');
        expect(pipe.transform('BACK')).toBe('Espalda');
        expect(pipe.transform('LEGS_FRONT')).toBe('Piernas frontales');
        expect(pipe.transform('LEGS_POSTERIOR')).toBe('Piernas posteriores');
        expect(pipe.transform('CARDIO')).toBe('Cardio');
    });

    it('translates canonical lowercase enum values', () => {
        expect(pipe.transform('biceps')).toBe('Bíceps');
        expect(pipe.transform('core')).toBe('Core');
    });

    it('translates comma-separated categories joined by dashes', () => {
        expect(pipe.transform('CHEST,BACK')).toBe('Pecho-Espalda');
        expect(pipe.transform('chest, back')).toBe('Pecho-Espalda');
    });

    it('returns an empty string for missing values', () => {
        expect(pipe.transform(undefined)).toBe('');
        expect(pipe.transform('')).toBe('');
    });

    it('falls back to a capitalized, de-underscored label for unknown values', () => {
        expect(pipe.transform('some_weird')).toBe('Some Weird');
        expect(pipe.transform('SOME_WEIRD')).toBe('Some Weird');
    });
});
