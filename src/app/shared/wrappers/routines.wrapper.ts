import { ExerciseCategory } from '../interfaces/exercise.interface';
import {
    KindEnum,
    RoutineDay,
    RoutineDayCreate,
    RoutineDayCreateSend,
    RoutineDayVM,
} from '../interfaces/routines.interface';
import { RoutineDayAPI } from '../interfaces/api/routines-api.interface';

export function wrapperRoutineDayAPItoRoutineDay(data: RoutineDayAPI[]): RoutineDay[] {
    return data.map((r) => {
        return {
            id: r.id,
            title: r.title,
            type:
                r.exercises?.reduce((acc, ex) => {
                    if (ex.exercise.category) {
                        if (!acc.includes(ex.exercise.category)) {
                            acc.push(ex.exercise.category);
                        }
                    }
                    return acc;
                }, [] as ExerciseCategory[]) || [],
            exercises: r.exercises?.map((ex) => ex.exercise) || [],
            kind: KindEnum.workout,
        };
    });
}

export function wrapperRoutineDayAPItoRoutineDayVM(data: RoutineDayAPI[]): RoutineDayVM[] {
    return data.map((r) => {
        return {
            id: r.id,
            title: r.title,
            type:
                r.exercises?.reduce((acc, ex) => {
                    if (ex.exercise.category) {
                        if (!acc.includes(ex.exercise.category)) {
                            acc.push(ex.exercise.category);
                        }
                    }
                    return acc;
                }, [] as ExerciseCategory[]) || [],
            exercises: r.exercises?.map((ex) => ex.exercise) || [],
            kind: KindEnum.workout,
            expanded: false,
            day: 1,
        };
    });
}

export function wrapperRoutineDayCreateToPayload(data: RoutineDayCreate): RoutineDayCreateSend {
    return {
        title: data.title,
        type: data.type,
        exercises: data.exercises?.map((ex, index) => ({ exercise: ex.id!, order: index })) || [],
        planId: data.planId,
    };
}

export function wrapperRoutineDayToExerciseIds(routineDay: RoutineDayCreate): string[] {
    if (routineDay.exercises === undefined) {
        return [''];
    }
    return routineDay.exercises.map((ex) => (ex.id ? ex.id : ''));
}
