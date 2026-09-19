import { DistributionDays, UserProfileContextAPI } from '../utils/profile.types';
import { wrapperProfileContextToDomain, wrapperProfileUserToDomain } from './profile.wrapper';

describe('profile.wrapper (TEST-001)', () => {
    const buildContext = (overrides: Partial<UserProfileContextAPI> = {}): UserProfileContextAPI =>
        ({
            profile: {
                id: 'profile-1',
                userId: 'user-1',
                gender: 'F',
                birthDate: '1995-05-20',
                heightCm: 170,
                weightKg: 62,
                bodyFatPct: 22,
                distributionDays: DistributionDays.DAY,
                unitsPreference: 'metric',
                createdAt: '2026-01-01',
                updatedAt: '2026-02-01',
            },
            goal: {
                _id: 'goal-1',
                userId: 'user-1',
                primaryGoal: 'muscle_gain',
                secondaryGoals: ['strength'],
                targetWeightKg: 68,
                timelineWeeks: 12,
                trainingExperience: 'intermediate',
                sportSpecificity: null,
                isActive: true,
                createdAt: '2026-01-01',
                updatedAt: '2026-02-01',
            },
            schedule: {
                _id: 'schedule-1',
                userId: 'user-1',
                daysPerWeek: 4,
                preferredDays: [1, 2],
                sessionDurationMin: 60,
                preferredTime: 'evening',
                restDayActivity: 'walk',
                createdAt: '2026-01-01',
                updatedAt: '2026-02-01',
            },
            strengthMetrics: [
                {
                    _id: 'sm-1',
                    userId: 'user-1',
                    exerciseKey: 'bench',
                    oneRmKg: 60,
                    repsAtWeight: { weightKg: 50, reps: 5 },
                    confidenceLevel: 'high',
                    measuredAt: '2026-01-15',
                    notes: 'felt strong',
                    createdAt: '2026-01-15',
                    updatedAt: '2026-01-15',
                },
            ],
            weightLogs: [
                {
                    _id: 'wl-1',
                    userId: 'user-1',
                    weightKg: 63,
                    bodyFatPct: 21,
                    loggedAt: '2026-01-20',
                    notes: null,
                    createdAt: '2026-01-20',
                    updatedAt: '2026-01-20',
                },
            ],
            ...overrides,
        }) as unknown as UserProfileContextAPI;

    it('maps the profile and its sub-records to the domain model', () => {
        const result = wrapperProfileContextToDomain(buildContext());

        expect(result).not.toBeNull();
        expect(result!.id).toBe('profile-1');
        expect(result!.userId).toBe('user-1');
        expect(result!.gender).toBe('F');
        expect(result!.distributionDays).toBe(DistributionDays.DAY);
        expect(result!.unitsPreference).toBe('metric');
        expect(result!.goal?.id).toBe('goal-1');
        expect(result!.goal?.secondaryGoals).toEqual(['strength']);
        expect(result!.schedule?.id).toBe('schedule-1');
        expect(result!.schedule?.preferredDays).toEqual([1, 2]);
        expect(result!.healthConstraints).toBeNull();
        expect(result!.trainingPreferences).toBeNull();
        expect(result!.resources).toBeNull();
    });

    it('maps the longitudinal collections and their _id keys', () => {
        const result = wrapperProfileContextToDomain(buildContext());

        expect(result!.strengthMetrics.length).toBe(1);
        expect(result!.strengthMetrics[0].id).toBe('sm-1');
        expect(result!.strengthMetrics[0].repsAtWeight).toEqual({ weightKg: 50, reps: 5 });
        expect(result!.weightLogs.length).toBe(1);
        expect(result!.weightLogs[0].id).toBe('wl-1');
        expect(result!.weightLogs[0].weightKg).toBe(63);
    });

    it('applies safe defaults when the profile is missing', () => {
        const result = wrapperProfileContextToDomain(
            buildContext({ profile: null, strengthMetrics: [], weightLogs: [] }),
            'user-9',
        );

        expect(result).not.toBeNull();
        expect(result!.id).toBe('');
        expect(result!.userId).toBe('user-9');
        expect(result!.gender).toBe('M');
        expect(result!.heightCm).toBe(0);
        expect(result!.weightKg).toBe(0);
        expect(result!.distributionDays).toBe(DistributionDays.WEEK);
        expect(result!.unitsPreference).toBe('metric');
        expect(result!.strengthMetrics).toEqual([]);
        expect(result!.weightLogs).toEqual([]);
    });

    it('returns null for a null context', () => {
        expect(wrapperProfileContextToDomain(null)).toBeNull();
        expect(wrapperProfileContextToDomain(undefined)).toBeNull();
    });

    it('maps a full profile API payload through wrapperProfileUserToDomain', () => {
        const api = buildContext().profile!;

        const result = wrapperProfileUserToDomain(api);

        expect(result!.id).toBe('profile-1');
        expect(result!.goal).toBeNull();
        expect(result!.strengthMetrics).toEqual([]);
        expect(result!.weightLogs).toEqual([]);
        expect(wrapperProfileUserToDomain(null)).toBeNull();
    });
});
