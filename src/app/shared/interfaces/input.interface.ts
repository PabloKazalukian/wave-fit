export interface SelectTypeInput {
    option: string;
}

export interface SelectType {
    name: string;
    value: number | string;
}

export const options: SelectType[] = [
    { name: 'chest', value: 'CHEST' },
    { name: 'back', value: 'BACK' },
    { name: 'legs', value: 'LEGS' },
    { name: 'legs_front', value: 'LEGS_FRONT' },
    { name: 'legs_posterior', value: 'LEGS_POSTERIOR' },
    { name: 'biceps', value: 'BICEPS' },
    { name: 'triceps', value: 'TRICEPS' },
    { name: 'shoulders', value: 'SHOULDERS' },
    { name: 'core', value: 'CORE' },
    { name: 'cardio', value: 'CARDIO' },
];
