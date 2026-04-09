import {
    CreateExtraSessionContext,
    UpdateWeekLogExtraSessionInput,
} from '../interfaces/extra-session.interface';

export function mapToUpdateWeekLogExtraSessionInput(
    context: CreateExtraSessionContext,
): UpdateWeekLogExtraSessionInput {
    return {
        id: context.weekLogId,
        days: [
            {
                order: context.dayOrder,
                extraSession: {
                    workoutSessionId: '1',
                    date: context.extraSession.date,
                    discipline: context.extraSession.discipline,
                    duration: context.extraSession.duration,
                    intensityLevel: context.extraSession.intensityLevel,
                    calories: context.extraSession.calories,
                    notes: context.extraSession.notes,
                },
            },
        ],
    };
}
