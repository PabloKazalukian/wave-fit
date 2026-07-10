import {
    Goal,
    GoalAPI,
    HealthConstraint,
    HealthConstraintAPI,
    Schedule,
    ScheduleAPI,
    TrainingPreference,
    TrainingPreferenceAPI,
    Resource,
    ResourceAPI,
    StrengthMetric,
    StrengthMetricAPI,
    WeightLog,
    WeightLogAPI,
    ProfileUser,
    ProfileUserAPI,
    UserProfileContextAPI,
} from '../utils/profile.types';

export function wrapperGoalToDomain(api: GoalAPI | null | undefined): Goal | null {
    if (!api) return null;
    return {
        id: api._id,
        userId: api.userId,
        primaryGoal: api.primaryGoal,
        secondaryGoals: api.secondaryGoals || [],
        targetWeightKg: api.targetWeightKg,
        timelineWeeks: api.timelineWeeks,
        trainingExperience: api.trainingExperience,
        sportSpecificity: api.sportSpecificity,
        isActive: api.isActive,
        createdAt: api.createdAt,
        updatedAt: api.updatedAt,
    };
}

export function wrapperHealthConstraintToDomain(
    api: HealthConstraintAPI | null | undefined,
): HealthConstraint | null {
    if (!api) return null;
    return {
        id: api._id,
        userId: api.userId,
        injuries: api.injuries || [],
        movementRestrictions: api.movementRestrictions || [],
        conditions: api.conditions || [],
        mobilityLevel: api.mobilityLevel,
        hasHealthcareSupervision: api.hasHealthcareSupervision,
        createdAt: api.createdAt,
        updatedAt: api.updatedAt,
    };
}

export function wrapperScheduleToDomain(api: ScheduleAPI | null | undefined): Schedule | null {
    if (!api) return null;
    return {
        id: api._id,
        userId: api.userId,
        daysPerWeek: api.daysPerWeek,
        preferredDays: api.preferredDays || [],
        sessionDurationMin: api.sessionDurationMin,
        preferredTime: api.preferredTime,
        restDayActivity: api.restDayActivity,
        createdAt: api.createdAt,
        updatedAt: api.updatedAt,
    };
}

export function wrapperTrainingPreferenceToDomain(
    api: TrainingPreferenceAPI | null | undefined,
): TrainingPreference | null {
    if (!api) return null;
    return {
        id: api._id,
        userId: api.userId,
        preferredStyles: api.preferredStyles || [],
        dislikedExercises: api.dislikedExercises || [],
        favoriteExercises: api.favoriteExercises || [],
        cardioPreference: api.cardioPreference,
        intensityPreference: api.intensityPreference,
        workoutVibe: api.workoutVibe,
        createdAt: api.createdAt,
        updatedAt: api.updatedAt,
    };
}

export function wrapperResourceToDomain(api: ResourceAPI | null | undefined): Resource | null {
    if (!api) return null;
    return {
        id: api._id,
        userId: api.userId,
        trainingEnvironments: api.trainingEnvironments || [],
        equipment: api.equipment,
        dumbbellMaxKg: api.dumbbellMaxKg,
        gymDistanceKm: api.gymDistanceKm,
        createdAt: api.createdAt,
        updatedAt: api.updatedAt,
    };
}

export function wrapperStrengthMetricToDomain(api: StrengthMetricAPI): StrengthMetric {
    return {
        id: api._id,
        userId: api.userId,
        exerciseKey: api.exerciseKey,
        oneRmKg: api.oneRmKg,
        repsAtWeight: api.repsAtWeight,
        confidenceLevel: api.confidenceLevel,
        measuredAt: api.measuredAt,
        notes: api.notes,
        createdAt: api.createdAt,
        updatedAt: api.updatedAt,
    };
}

export function wrapperWeightLogToDomain(api: WeightLogAPI): WeightLog {
    return {
        id: api._id,
        userId: api.userId,
        weightKg: api.weightKg,
        bodyFatPct: api.bodyFatPct,
        loggedAt: api.loggedAt,
        notes: api.notes,
        createdAt: api.createdAt,
        updatedAt: api.updatedAt,
    };
}

export function wrapperProfileUserToDomain(api: ProfileUserAPI | null | undefined): ProfileUser | null {
    if (!api) return null;
    return {
        id: api.id,
        userId: api.userId,
        gender: api.gender,
        birthDate: api.birthDate,
        heightCm: api.heightCm,
        weightKg: api.weightKg,
        bodyFatPct: api.bodyFatPct,
        distributionDays: api.distributionDays,
        unitsPreference: api.unitsPreference,
        createdAt: api.createdAt,
        updatedAt: api.updatedAt,
        goal: wrapperGoalToDomain(api.goal),
        healthConstraints: wrapperHealthConstraintToDomain(api.healthConstraints),
        schedule: wrapperScheduleToDomain(api.schedule),
        trainingPreferences: wrapperTrainingPreferenceToDomain(api.trainingPreferences),
        resources: wrapperResourceToDomain(api.resources),
        strengthMetrics: (api.strengthMetrics || []).map(wrapperStrengthMetricToDomain),
        weightLogs: (api.weightLogs || []).map(wrapperWeightLogToDomain),
    };
}

export function wrapperProfileContextToDomain(
    api: UserProfileContextAPI | null | undefined,
    userIdFallback?: string
): ProfileUser | null {
    if (!api) return null;
    const profile = api.profile;
    return {
        id: profile?.id || '',
        userId: profile?.userId || userIdFallback || '',
        gender: profile?.gender || 'M',
        birthDate: profile?.birthDate || '',
        heightCm: profile?.heightCm || 0,
        weightKg: profile?.weightKg || 0,
        bodyFatPct: profile?.bodyFatPct,
        distributionDays: profile?.distributionDays || 'Week-log',
        unitsPreference: profile?.unitsPreference || 'metric',
        createdAt: profile?.createdAt || '',
        updatedAt: profile?.updatedAt || '',
        goal: wrapperGoalToDomain(api.goal),
        healthConstraints: wrapperHealthConstraintToDomain(api.healthConstraints),
        schedule: wrapperScheduleToDomain(api.schedule),
        trainingPreferences: wrapperTrainingPreferenceToDomain(api.trainingPreferences),
        resources: wrapperResourceToDomain(api.resources),
        strengthMetrics: (api.strengthMetrics || []).map(wrapperStrengthMetricToDomain),
        weightLogs: (api.weightLogs || []).map(wrapperWeightLogToDomain),
    };
}
