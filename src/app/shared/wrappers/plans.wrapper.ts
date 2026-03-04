import { RoutinePlanSend, RoutinePlanVM } from '../interfaces/routines.interface';

export function wrapperRoutinePlanVMtoRoutinePlan(routinePlanVM: RoutinePlanVM): RoutinePlanSend {
    return {
        name: routinePlanVM.name,
        description: routinePlanVM.description,
        weekly_distribution: routinePlanVM.weekly_distribution,
        routineDays: routinePlanVM.routineDays.map((d) => d?.id || ''),
        createdBy: routinePlanVM.createdBy,
    };
}
