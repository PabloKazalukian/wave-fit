import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { DistributionDays, ProfileUser } from '../../../shared/utils/profile.types';
import { AuthService } from '../auth/auth.service';
import { UserProfileDomainService } from './user-profile.domain';
import { UserProfileService } from './user-profile.service';
import { UserProfileStateService } from './user-profile.state';

describe('UserProfileService', () => {
    let service: UserProfileService;
    let domain: {
        initUserProfile: jasmine.Spy;
        updateProfile: jasmine.Spy;
        updateGoals: jasmine.Spy;
        updateSchedule: jasmine.Spy;
    };
    let state: UserProfileStateService;
    let user$: BehaviorSubject<string | null>;

    const buildProfile = (overrides: Partial<ProfileUser> = {}): ProfileUser => ({
        id: 'profile-1',
        userId: 'user-1',
        gender: 'M',
        birthDate: '1995-01-01',
        heightCm: 180,
        weightKg: 75,
        distributionDays: DistributionDays.WEEK,
        unitsPreference: 'metric',
        createdAt: '2026-01-01',
        updatedAt: '2026-02-01',
        goal: null,
        healthConstraints: null,
        schedule: null,
        trainingPreferences: null,
        resources: null,
        strengthMetrics: [],
        weightLogs: [],
        ...overrides,
    });

    beforeEach(() => {
        domain = {
            initUserProfile: jasmine.createSpy('initUserProfile').and.returnValue(of(null)),
            updateProfile: jasmine.createSpy('updateProfile').and.returnValue(of(null)),
            updateGoals: jasmine.createSpy('updateGoals').and.returnValue(of(null)),
            updateSchedule: jasmine.createSpy('updateSchedule').and.returnValue(of(null)),
        };
        user$ = new BehaviorSubject<string | null>(null);

        TestBed.configureTestingModule({
            providers: [
                UserProfileService,
                { provide: UserProfileDomainService, useValue: domain },
                { provide: AuthService, useValue: { user$: user$.asObservable() } },
            ],
        });

        state = TestBed.inject(UserProfileStateService);
        service = TestBed.inject(UserProfileService);
    });

    const flush = () => TestBed.inject(ApplicationRef).tick();

    describe('initUserProfile (TEST-001)', () => {
        it('loads and stores the profile when a user authenticates', () => {
            const profile = buildProfile();
            domain.initUserProfile.and.returnValue(of(profile));

            user$.next('user-1');
            flush();

            expect(domain.initUserProfile).toHaveBeenCalledTimes(1);
            expect(state.getUserProfile()).toEqual(profile);
            expect(state.loading()).toBe(false);
        });

        it('does not reload the profile once it is cached (load-once guard)', () => {
            domain.initUserProfile.and.returnValue(of(buildProfile()));

            user$.next('user-1');
            flush();
            user$.next('user-2');
            flush();

            expect(domain.initUserProfile).toHaveBeenCalledTimes(1);
        });

        it('clears the state when the user logs out', () => {
            domain.initUserProfile.and.returnValue(of(buildProfile()));
            user$.next('user-1');
            flush();
            expect(state.getUserProfile()).toEqual(buildProfile());

            user$.next(null);
            flush();

            expect(state.getUserProfile()).toBeNull();
        });

        it('records the error and stops loading when the refresh fails', () => {
            domain.initUserProfile.and.returnValue(throwError(() => new Error('boom')));

            service.fetchUserProfile().subscribe({ error: () => undefined });

            expect(state.getUserProfile()).toBeNull();
            expect(state.error()).toBe('boom');
            expect(state.loading()).toBe(false);
        });
    });

    describe('fetchUserProfile', () => {
        it('refreshes the state from the domain', () => {
            const profile = buildProfile({ weightKg: 80 });
            domain.initUserProfile.and.returnValue(of(profile));
            let result: ProfileUser | null | undefined;

            service.fetchUserProfile().subscribe((res) => (result = res));

            expect(result).toEqual(profile);
            expect(state.getUserProfile()).toEqual(profile);
            expect(state.loading()).toBe(false);
        });
    });

    describe('updateProfile (TEST-003)', () => {
        it('merges the result into the current profile', () => {
            state.setUserProfile(buildProfile({ weightKg: 70, heightCm: 180 }));
            domain.updateProfile.and.returnValue(of({ weightKg: 72 } as ProfileUser));
            let result: ProfileUser | null | undefined;

            service.updateProfile({ weightKg: 72 }).subscribe((res) => (result = res));

            const merged = state.getUserProfile()!;
            expect(result).toEqual({ weightKg: 72 } as ProfileUser);
            expect(merged.weightKg).toBe(72);
            expect(merged.heightCm).toBe(180);
            expect(merged.id).toBe('profile-1');
        });

        it('stores the result directly when there is no current profile', () => {
            const result = buildProfile({ id: 'profile-new' });
            domain.updateProfile.and.returnValue(of(result));

            service.updateProfile({ weightKg: 90 }).subscribe();

            expect(state.getUserProfile()).toEqual(result);
        });

        it('records the error without dropping the current profile', () => {
            const current = buildProfile();
            state.setUserProfile(current);
            domain.updateProfile.and.returnValue(throwError(() => new Error('update failed')));

            service.updateProfile({ weightKg: 100 }).subscribe({ error: () => undefined });

            expect(state.error()).toBe('update failed');
            expect(state.getUserProfile()).toEqual(current);
            expect(state.loading()).toBe(false);
        });
    });
});
