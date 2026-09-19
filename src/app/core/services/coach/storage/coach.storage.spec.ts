import { TestBed } from '@angular/core/testing';
import { TrainingPlanDetail } from '../../../../shared/interfaces/coach.interface';
import { CoachStorageService } from './coach.storage';

describe('CoachStorageService (TEST-004)', () => {
    let service: CoachStorageService;

    const buildPlan = (id = 'plan-1'): TrainingPlanDetail =>
        ({
            id,
            title: 'Hypertrophy',
            durationWeeks: 4,
            trainingDaysPerWeek: 4,
        }) as TrainingPlanDetail;

    beforeEach(() => {
        localStorage.clear();
        TestBed.configureTestingModule({ providers: [CoachStorageService] });
        service = TestBed.inject(CoachStorageService);
    });

    afterEach(() => localStorage.clear());

    it('persists and reads a plan per user', () => {
        const plan = buildPlan();

        service.setGeneratedPlan(plan, 'user-1');

        expect(localStorage.getItem('coach_generated_plan:user-1')).toBe(JSON.stringify(plan));
        expect(service.getGeneratedPlan('user-1')).toEqual(plan);
    });

    it('keeps drafts isolated between users', () => {
        service.setGeneratedPlan(buildPlan('a'), 'user-1');
        service.setGeneratedPlan(buildPlan('b'), 'user-2');

        expect(service.getGeneratedPlan('user-1')?.id).toBe('a');
        expect(service.getGeneratedPlan('user-2')?.id).toBe('b');
    });

    it('falls back to the default key when no user is provided', () => {
        const plan = buildPlan();

        service.setGeneratedPlan(plan);

        expect(localStorage.getItem('coach_generated_plan:default')).toBe(JSON.stringify(plan));
        expect(service.getGeneratedPlan()).toEqual(plan);
    });

    it('returns null when no draft is stored', () => {
        expect(service.getGeneratedPlan('user-1')).toBeNull();
    });

    it('returns null instead of throwing on corrupted data', () => {
        localStorage.setItem('coach_generated_plan:user-1', '{not-json');

        expect(service.getGeneratedPlan('user-1')).toBeNull();
    });

    it('removes only the given user draft', () => {
        service.setGeneratedPlan(buildPlan('a'), 'user-1');
        service.setGeneratedPlan(buildPlan('b'), 'user-2');

        service.removeGeneratedPlan('user-1');

        expect(service.getGeneratedPlan('user-1')).toBeNull();
        expect(service.getGeneratedPlan('user-2')?.id).toBe('b');
    });
});
