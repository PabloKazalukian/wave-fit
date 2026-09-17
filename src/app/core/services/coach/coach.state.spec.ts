import { ApplicationRef, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TrainingPlanDetail } from '../../../shared/interfaces/coach.interface';
import { User } from '../../../shared/interfaces/token.interface';
import { AuthService } from '../auth/auth.service';
import { CoachState } from './coach.state';
import { CoachStorageService } from './storage/coach.storage';

describe('CoachState (TEST-004)', () => {
    let state: CoachState;
    let storage: {
        getGeneratedPlan: jasmine.Spy;
        setGeneratedPlan: jasmine.Spy;
        removeGeneratedPlan: jasmine.Spy;
    };
    let userSignal: ReturnType<typeof signal<User | null>>;

    const buildUser = (): User => ({
        id: 'user-1',
        name: 'Ada',
        email: 'ada@test.com',
        avatar: null,
        role: 'user',
    });

    const buildPlan = (id = 'plan-1'): TrainingPlanDetail =>
        ({ id, title: 'Hypertrophy', durationWeeks: 4 }) as TrainingPlanDetail;

    beforeEach(() => {
        spyOn(console, 'log');
        storage = {
            getGeneratedPlan: jasmine.createSpy('getGeneratedPlan').and.returnValue(null),
            setGeneratedPlan: jasmine.createSpy('setGeneratedPlan'),
            removeGeneratedPlan: jasmine.createSpy('removeGeneratedPlan'),
        };
        userSignal = signal<User | null>(null);

        TestBed.configureTestingModule({
            providers: [
                CoachState,
                { provide: CoachStorageService, useValue: storage },
                { provide: AuthService, useValue: { user: userSignal } },
            ],
        });

        state = TestBed.inject(CoachState);
    });

    const flush = () => TestBed.inject(ApplicationRef).tick();

    it('starts with no active plan', () => {
        expect(state.activePlan()).toBeNull();
        expect(state.hasActivePlan()).toBe(false);
    });

    it('restores the cached draft for the authenticated user', () => {
        const plan = buildPlan();
        storage.getGeneratedPlan.and.returnValue(plan);
        userSignal.set(buildUser());

        flush();

        expect(storage.getGeneratedPlan).toHaveBeenCalledWith('user-1');
        expect(state.activePlan()).toEqual(plan);
        expect(state.hasActivePlan()).toBe(true);
    });

    it('does not load a draft for an anonymous user', () => {
        storage.getGeneratedPlan.and.returnValue(buildPlan());
        userSignal.set(null);

        flush();

        expect(storage.getGeneratedPlan).not.toHaveBeenCalled();
        expect(state.activePlan()).toBeNull();
    });

    it('sets a plan and persists it for the current user', () => {
        userSignal.set(buildUser());
        const plan = buildPlan();

        state.setPlan(plan);

        expect(state.activePlan()).toEqual(plan);
        expect(state.hasActivePlan()).toBe(true);
        expect(storage.setGeneratedPlan).toHaveBeenCalledWith(plan, 'user-1');
    });

    it('sets a plan without persisting when persist is false', () => {
        userSignal.set(buildUser());
        const plan = buildPlan();

        state.setPlan(plan, false);

        expect(state.activePlan()).toEqual(plan);
        expect(storage.setGeneratedPlan).not.toHaveBeenCalled();
    });

    it('clears the plan and removes the stored draft', () => {
        userSignal.set(buildUser());
        state.setPlan(buildPlan());

        state.clearPlan();

        expect(state.activePlan()).toBeNull();
        expect(state.hasActivePlan()).toBe(false);
        expect(storage.removeGeneratedPlan).toHaveBeenCalledWith('user-1');
    });

    it('loads a draft for an explicit user id', () => {
        const plan = buildPlan('plan-9');
        storage.getGeneratedPlan.and.returnValue(plan);

        state.loadCachedPlan('user-9');

        expect(storage.getGeneratedPlan).toHaveBeenCalledWith('user-9');
        expect(state.activePlan()).toEqual(plan);
    });

    it('keeps the current plan when no cached draft exists', () => {
        storage.getGeneratedPlan.and.returnValue(null);

        state.loadCachedPlan('user-9');

        expect(state.activePlan()).toBeNull();
    });
});
