export type Gender = 'M' | 'F' | 'other';
export type UnitsPreference = 'metric' | 'imperial';
export type DistributionDays = 'Week-log' | 'Day-log';

export type PrimaryGoal =
    | 'fat_loss'
    | 'muscle_gain'
    | 'strength'
    | 'endurance'
    | 'maintenance'
    | 'recomp';
export type TrainingExperience = 'beginner' | 'intermediate' | 'advanced' | 'athlete';

export type InjurySeverity = 'mild' | 'moderate' | 'severe';
export type BodyPart =
    | 'lower_back'
    | 'upper_back'
    | 'neck'
    | 'left_shoulder'
    | 'right_shoulder'
    | 'left_knee'
    | 'right_knee'
    | 'left_hip'
    | 'right_hip'
    | 'left_elbow'
    | 'right_elbow'
    | 'left_wrist'
    | 'right_wrist'
    | 'left_ankle'
    | 'right_ankle'
    | 'core'
    | 'chest';
export type MobilityLevel = 'limited' | 'moderate' | 'good' | 'excellent';

export type PreferredTime = 'morning' | 'noon' | 'afternoon' | 'evening';
export type RestDayActivity = 'full_rest' | 'light_walk' | 'active_recovery' | 'yoga_stretching';

export type TrainingStyle =
    | 'powerlifting'
    | 'hypertrophy'
    | 'hiit'
    | 'circuit'
    | 'functional'
    | 'pilates'
    | 'yoga'
    | 'calisthenics'
    | 'cardio'
    | 'crossfit';
export type CardioPreference = 'none' | 'low_intensity' | 'hiit' | 'mixed';
export type IntensityPreference = 'light' | 'moderate' | 'intense' | 'max_effort';

export type TrainingEnvironment = 'gym' | 'home' | 'outdoor' | 'hotel' | 'crossfit_box';

export type ConfidenceLevel = 'tested' | 'estimated' | 'self_reported';

export interface AvailableEquipment {
    barbell: boolean;
    squat_rack: boolean;
    power_rack: boolean;
    cables: boolean;
    smith_machine: boolean;
    leg_press: boolean;
    dumbbells: boolean;
    kettlebells: boolean;
    resistance_bands: boolean;
    pullup_bar: boolean;
    dip_bars: boolean;
    trx: boolean;
    treadmill: boolean;
    stationary_bike: boolean;
    rowing_machine: boolean;
    elliptical: boolean;
    jump_rope: boolean;
    ab_wheel: boolean;
    foam_roller: boolean;
}

export interface RepsAtWeight {
    weightKg: number;
    reps: number;
}

export interface Injury {
    bodyPart: BodyPart;
    severity: InjurySeverity;
    isActive: boolean;
    description?: string;
}

// ── Sub-schemas individuales (API) ──

export interface GoalAPI {
    _id: string;
    userId: string;
    primaryGoal: PrimaryGoal;
    secondaryGoals: string[];
    targetWeightKg?: number;
    timelineWeeks?: number;
    trainingExperience: TrainingExperience;
    sportSpecificity?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface HealthConstraintAPI {
    _id: string;
    userId: string;
    injuries: Injury[];
    movementRestrictions: string[];
    conditions: string[];
    mobilityLevel: MobilityLevel;
    hasHealthcareSupervision: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ScheduleAPI {
    _id: string;
    userId: string;
    daysPerWeek: number;
    preferredDays: number[];
    sessionDurationMin: number;
    preferredTime?: PreferredTime;
    restDayActivity: RestDayActivity;
    createdAt: string;
    updatedAt: string;
}

export interface TrainingPreferenceAPI {
    _id: string;
    userId: string;
    preferredStyles: TrainingStyle[];
    dislikedExercises: string[];
    favoriteExercises: string[];
    cardioPreference: CardioPreference;
    intensityPreference: IntensityPreference;
    workoutVibe?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ResourceAPI {
    _id: string;
    userId: string;
    trainingEnvironments: TrainingEnvironment[];
    equipment: AvailableEquipment;
    dumbbellMaxKg?: number;
    gymDistanceKm?: number;
    createdAt: string;
    updatedAt: string;
}

export interface StrengthMetricAPI {
    _id: string;
    userId: string;
    exerciseKey: string;
    oneRmKg: number;
    repsAtWeight?: RepsAtWeight;
    confidenceLevel: ConfidenceLevel;
    measuredAt: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface WeightLogAPI {
    _id: string;
    userId: string;
    weightKg: number;
    bodyFatPct?: number;
    loggedAt: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

// ── Sub-schemas individuales (Dominio) ──

export interface Goal {
    id: string;
    userId: string;
    primaryGoal: PrimaryGoal;
    secondaryGoals: string[];
    targetWeightKg?: number;
    timelineWeeks?: number;
    trainingExperience: TrainingExperience;
    sportSpecificity?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface HealthConstraint {
    id: string;
    userId: string;
    injuries: Injury[];
    movementRestrictions: string[];
    conditions: string[];
    mobilityLevel: MobilityLevel;
    hasHealthcareSupervision: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Schedule {
    id: string;
    userId: string;
    daysPerWeek: number;
    preferredDays: number[];
    sessionDurationMin: number;
    preferredTime?: PreferredTime;
    restDayActivity: RestDayActivity;
    createdAt: string;
    updatedAt: string;
}

export interface TrainingPreference {
    id: string;
    userId: string;
    preferredStyles: TrainingStyle[];
    dislikedExercises: string[];
    favoriteExercises: string[];
    cardioPreference: CardioPreference;
    intensityPreference: IntensityPreference;
    workoutVibe?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Resource {
    id: string;
    userId: string;
    trainingEnvironments: TrainingEnvironment[];
    equipment: AvailableEquipment;
    dumbbellMaxKg?: number;
    gymDistanceKm?: number;
    createdAt: string;
    updatedAt: string;
}

export interface StrengthMetric {
    id: string;
    userId: string;
    exerciseKey: string;
    oneRmKg: number;
    repsAtWeight?: RepsAtWeight;
    confidenceLevel: ConfidenceLevel;
    measuredAt: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface WeightLog {
    id: string;
    userId: string;
    weightKg: number;
    bodyFatPct?: number;
    loggedAt: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

// ── Profile base ──

export interface ProfileUserAPI {
    id: string;
    userId: string;
    gender: Gender;
    birthDate: string;
    heightCm: number;
    weightKg: number;
    bodyFatPct?: number;
    distributionDays: DistributionDays;
    unitsPreference: UnitsPreference;
    createdAt: string;
    updatedAt: string;

    goal?: GoalAPI | null;
    healthConstraints?: HealthConstraintAPI | null;
    schedule?: ScheduleAPI | null;
    trainingPreferences?: TrainingPreferenceAPI | null;
    resources?: ResourceAPI | null;
    strengthMetrics: StrengthMetricAPI[];
    weightLogs: WeightLogAPI[];
}

export interface UserProfileContextAPI {
    profile?: ProfileUserAPI | null;
    goal?: GoalAPI | null;
    healthConstraints?: HealthConstraintAPI | null;
    schedule?: ScheduleAPI | null;
    trainingPreferences?: TrainingPreferenceAPI | null;
    resources?: ResourceAPI | null;
    strengthMetrics?: StrengthMetricAPI[] | null;
    weightLogs?: WeightLogAPI[] | null;
}

export interface ProfileUser {
    id: string;
    userId: string;
    gender: Gender;
    birthDate: string;
    heightCm: number;
    weightKg: number;
    bodyFatPct?: number;
    distributionDays: DistributionDays;
    unitsPreference: UnitsPreference;
    createdAt: string;
    updatedAt: string;

    // Sub-records (cada query devuelve estos por separado, pero puedes mapearlos a uno solo)
    goal?: Goal | null;
    healthConstraints?: HealthConstraint | null;
    schedule?: Schedule | null;
    trainingPreferences?: TrainingPreference | null;
    resources?: Resource | null;
    strengthMetrics: StrengthMetric[];
    weightLogs: WeightLog[];
}

// ── Inputs para mutations ──

export type UpdateProfileInput = Partial<{
    gender: Gender;
    birthDate: string;
    heightCm: number;
    weightKg: number;
    bodyFatPct: number;
    distributionDays: DistributionDays;
    unitsPreference: UnitsPreference;
}>;

export type UpdateGoalsInput = {
    primaryGoal: PrimaryGoal;
    secondaryGoals?: string[];
    targetWeightKg?: number;
    timelineWeeks?: number;
    trainingExperience: TrainingExperience;
    sportSpecificity?: string;
};

export type UpdateScheduleInput = {
    daysPerWeek: number;
    preferredDays?: number[];
    sessionDurationMin?: number;
    preferredTime?: PreferredTime;
    restDayActivity?: RestDayActivity;
};

export type UpdateHealthConstraintsInput = {
    injuries?: {
        bodyPart: BodyPart;
        severity: InjurySeverity;
        isActive?: boolean;
        description?: string;
    }[];
    movementRestrictions?: string[];
    conditions?: string[];
    mobilityLevel?: MobilityLevel;
    hasHealthcareSupervision?: boolean;
};

export type UpdateTrainingPreferenceInput = {
    preferredStyles: TrainingStyle[];
    dislikedExercises?: string[];
    favoriteExercises?: string[];
    cardioPreference?: CardioPreference;
    intensityPreference?: IntensityPreference;
    workoutVibe?: string;
};

export type UpdateResourceInput = {
    trainingEnvironments: TrainingEnvironment[];
    equipment?: Partial<AvailableEquipment>;
    dumbbellMaxKg?: number;
    gymDistanceKm?: number;
};

export type CreateStrengthMetricInput = {
    exerciseKey: string;
    oneRmKg: number;
    repsAtWeight?: { weightKg: number; reps: number };
    confidenceLevel?: ConfidenceLevel;
    measuredAt?: string;
    notes?: string;
};

export type CreateWeightLogInput = {
    weightKg: number;
    bodyFatPct?: number;
    loggedAt?: string;
    notes?: string;
};
