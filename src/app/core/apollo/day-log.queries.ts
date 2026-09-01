import { gql } from 'apollo-angular';

export const DAY_LOG_FIELDS = `
    id
    date
    planId
    routineDayId
    workoutSessionId
    exercises {
        exerciseId
        series
        sets {
            reps
            weights
        }
    }
    extraSessionIds
    status
    active
    completed
    notes
`;

/**
 * Fuente de verdad de arranque: ¿hay tracking activo y de qué tipo?
 */
export const ACTIVE_TRACKING = gql`
    query ActiveTracking {
        activeTracking {
            hasActive
            type
            week {
                id
                startDate
                endDate
                completed
                active
            }
            day {
                id
                date
                completed
                active
                status
            }
        }
    }
`;

export const ACTIVE_DAY_LOG = gql`
    query ActiveDayLog {
        activeDayLog {
            hasActiveDay
            day {
                id
                date
                completed
                active
                status
                workoutSessionId
            }
        }
    }
`;

export const CREATE_DAY_LOG = gql`
    mutation CreateDayLog($input: CreateDayLogInput!) {
        createDayLog(createDayLogInput: $input) {
            id
            date
            planId
            routineDayId
            workoutSessionId
            exercises {
                exerciseId
                series
                sets {
                    reps
                    weights
                }
            }
            extraSessionIds
            status
            active
            completed
            notes
        }
    }
`;

export const UPDATE_DAY_LOG = gql`
    mutation UpdateDayLog($input: UpdateDayLogInput!) {
        updateDayLog(input: $input) {
            id
            active
            completed
            notes
        }
    }
`;

export const UPDATE_DAY_LOG_STATUS = gql`
    mutation UpdateDayLogStatus($date: String!, $isRest: Boolean!) {
        updateDayLogStatus(date: $date, isRest: $isRest) {
            id
            status
            workoutSessionId
            active
        }
    }
`;

export const ASSIGN_ROUTINE_TO_DAY_LOG = gql`
    mutation AssignRoutineToDayLog($routineDayId: String!, $date: String!) {
        assignRoutineToDayLog(routineDayId: $routineDayId, date: $date) {
            id
            routineDayId
            workoutSessionId
            exercises {
                exerciseId
            }
        }
    }
`;

export const REMOVE_WORKOUT_SESSION_FROM_DAY_LOG = gql`
    mutation RemoveWorkoutSessionFromDayLog($workoutSessionId: String!) {
        removeWorkoutSessionFromDayLog(workoutSessionId: $workoutSessionId) {
            id
            workoutSessionId
            status
        }
    }
`;

export const REMOVE_EXTRA_SESSION_FROM_DAY_LOG = gql`
    mutation RemoveExtraSessionFromDayLog($extraSessionId: String!) {
        removeExtraSessionFromDayLog(extraSessionId: $extraSessionId) {
            id
            extraSessionIds
        }
    }
`;

export const DAY_LOGS = gql`
    query DayLogs($limit: Float, $offset: Float) {
        dayLogFindAll(limit: $limit, offset: $offset) {
            id
            date
            completed
            active
            status
        }
    }
`;

export const FIND_DAY_LOG_BY_ID = gql`
    query DayLog($id: String!) {
        dayLogFindOne(id: $id) {
            id
            date
            exercises {
                exerciseId
            }
            status
            active
            completed
        }
    }
`;

export const REMOVE_DAY_LOG = gql`
    mutation RemoveDayLog($id: String!) {
        removeDayLog(id: $id) {
            id
        }
    }
`;
