import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'translateLabel',
    standalone: true,
})
export class TranslateLabelPipe implements PipeTransform {
    private readonly keyLabels: Record<string, string> = {
        gender: 'Género',
        birthDate: 'Fecha de nacimiento',
        heightCm: 'Altura (cm)',
        weightKg: 'Peso (kg)',
        bodyFatPct: '% Grasa corporal',
        distributionDays: 'Frecuencia de registro',
        unitsPreference: 'Unidades',
        primaryGoal: 'Objetivo principal',
        secondaryGoals: 'Objetivos secundarios',
        targetWeightKg: 'Peso objetivo (kg)',
        timelineWeeks: 'Plazo (semanas)',
        trainingExperience: 'Experiencia de entrenamiento',
        sportSpecificity: 'Deporte específico',
        isActive: 'Activo',
        injuries: 'Lesiones',
        bodyPart: 'Parte del cuerpo',
        severity: 'Gravedad',
        description: 'Descripción',
        movementRestrictions: 'Restricciones de movimiento',
        conditions: 'Condiciones médicas',
        mobilityLevel: 'Nivel de movilidad',
        hasHealthcareSupervision: 'Supervisión médica',
        daysPerWeek: 'Días por semana',
        preferredDays: 'Días preferidos',
        sessionDurationMin: 'Duración de sesión (min)',
        preferredTime: 'Hora preferida',
        restDayActivity: 'Actividad día de descanso',
        preferredStyles: 'Estilos preferidos',
        dislikedExercises: 'Ejercicios no preferidos',
        favoriteExercises: 'Ejercicios favoritos',
        cardioPreference: 'Preferencia cardio',
        intensityPreference: 'Intensidad preferida',
        workoutVibe: 'Ambiente de entrenamiento',
        trainingEnvironments: 'Entornos de entrenamiento',
        equipment: 'Equipamiento disponible',
        dumbbellMaxKg: 'Mancuerna máx. (kg)',
        gymDistanceKm: 'Distancia al gimnasio (km)',
        exerciseKey: 'Ejercicio',
        oneRmKg: '1RM (kg)',
        repsAtWeight: 'Reps con peso',
        reps: 'Reps',
        confidenceLevel: 'Nivel de confianza',
        measuredAt: 'Fecha de medición',
        notes: 'Notas',
        loggedAt: 'Fecha de registro',
    };

    private readonly valueLabels: Record<string, string> = {
        M: 'Masculino',
        F: 'Femenino',
        other: 'Otro',
        metric: 'Métrico',
        imperial: 'Imperial',
        'Week-log': 'Semanal',
        'Day-log': 'Diario',
        fat_loss: 'Pérdida de grasa',
        muscle_gain: 'Ganar músculo',
        strength: 'Fuerza',
        endurance: 'Resistencia',
        maintenance: 'Mantenimiento',
        recomp: 'Recomposición corporal',
        beginner: 'Principiante',
        intermediate: 'Intermedio',
        advanced: 'Avanzado',
        athlete: 'Atleta',
        mild: 'Leve',
        moderate: 'Moderado',
        severe: 'Grave',
        lower_back: 'Lumbar',
        upper_back: 'Espalda alta',
        neck: 'Cuello',
        left_shoulder: 'Hombro izquierdo',
        right_shoulder: 'Hombro derecho',
        left_knee: 'Rodilla izquierda',
        right_knee: 'Rodilla derecha',
        left_hip: 'Cadera izquierda',
        right_hip: 'Cadera derecha',
        left_elbow: 'Codo izquierdo',
        right_elbow: 'Codo derecho',
        left_wrist: 'Muñeca izquierda',
        right_wrist: 'Muñeca derecha',
        left_ankle: 'Tobillo izquierdo',
        right_ankle: 'Tobillo derecho',
        core: 'Core',
        chest: 'Pecho',
        limited: 'Limitado',
        good: 'Bueno',
        excellent: 'Excelente',
        morning: 'Mañana',
        noon: 'Mediodía',
        afternoon: 'Tarde',
        evening: 'Noche',
        full_rest: 'Descanso total',
        light_walk: 'Caminata ligera',
        active_recovery: 'Recuperación activa',
        yoga_stretching: 'Yoga/estiramiento',
        powerlifting: 'Powerlifting',
        hypertrophy: 'Hipertrofia',
        hiit: 'HIIT',
        circuit: 'Circuito',
        functional: 'Funcional',
        pilates: 'Pilates',
        yoga: 'Yoga',
        calisthenics: 'Calistenia',
        cardio: 'Cardio',
        crossfit: 'CrossFit',
        none: 'Ninguno',
        low_intensity: 'Intensidad baja',
        intense: 'Intensa',
        max_effort: 'Máximo esfuerzo',
        light: 'Ligera',
        gym: 'Gimnasio',
        home: 'Casa',
        outdoor: 'Aire libre',
        hotel: 'Hotel',
        crossfit_box: 'Box de CrossFit',
        tested: 'Probado',
        estimated: 'Estimado',
        self_reported: 'Autoreportado',
        mixed: 'Mixto',
        barbell: 'Barra',
        squat_rack: 'Soporte sentadillas',
        power_rack: 'Jaula de potencia',
        cables: 'Poleas',
        smith_machine: 'Máquina Smith',
        leg_press: 'Prensa de piernas',
        dumbbells: 'Mancuernas',
        kettlebells: 'Kettlebells',
        resistance_bands: 'Bandas de resistencia',
        pullup_bar: 'Barra dominadas',
        dip_bars: 'Barras fondos',
        trx: 'TRX',
        treadmill: 'Cinta',
        stationary_bike: 'Bicicleta fija',
        rowing_machine: 'Remo',
        elliptical: 'Elíptica',
        jump_rope: 'Cuerda',
        ab_wheel: 'Rueda abdominal',
        foam_roller: 'Foam roller',
    };

    private readonly weekDays: string[] = [
        '',
        'Lunes',
        'Martes',
        'Miércoles',
        'Jueves',
        'Viernes',
        'Sábado',
        'Domingo',
    ];

    private readonly dateKeys = new Set(['birthDate', 'measuredAt', 'loggedAt']);

    transform(value: unknown, key?: string): string {
        if (value === null || value === undefined || value === '') return '';

        if (key) {
            if (typeof value === 'boolean') return value ? 'Sí' : 'No';

            if (typeof value === 'number') {
                if (key === 'preferredDays') return this.weekDays[value] ?? String(value);
                return String(value);
            }

            if (this.dateKeys.has(key) && typeof value === 'string') {
                const date = new Date(value);
                if (!isNaN(date.getTime())) return date.toLocaleDateString('es-ES');
            }

            if (typeof value === 'string') {
                const lowerValue = value.toLowerCase();
                if (this.valueLabels[lowerValue]) return this.valueLabels[lowerValue];
                if (this.valueLabels[value]) return this.valueLabels[value];
                return value;
            }
        }

        if (typeof value === 'string') {
            if (this.keyLabels[value]) return this.keyLabels[value];
            if (this.valueLabels[value]) return this.valueLabels[value];
            return this.formatKey(value);
        }

        return String(value);
    }

    private formatKey(key: string): string {
        return key.replace(/([A-Z])/g, ' $1').replace(/^./, (x) => x.toUpperCase());
    }
}
