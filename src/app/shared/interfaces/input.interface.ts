export interface SelectTypeInput {
    option: string;
}

export interface SelectType {
    name: string;
    value: number | string;
}

export const options: SelectType[] = [
    { name: 'Pectorales', value: 'CHEST' },
    { name: 'Espalda', value: 'BACK' },
    { name: 'Piernas', value: 'LEGS' },
    { name: 'Piernas frontal', value: 'LEGS_FRONT' },
    { name: 'Piernas posterior', value: 'LEGS_POSTERIOR' },
    { name: 'Biceps', value: 'BICEPS' },
    { name: 'Triceps', value: 'TRICEPS' },
    { name: 'Hombros', value: 'SHOULDERS' },
    { name: 'Core', value: 'CORE' },
    { name: 'Cardio', value: 'CARDIO' },
];
