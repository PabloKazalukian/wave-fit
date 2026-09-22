import { gql } from 'apollo-angular';

export const WEEK_LOG_FIELDS = `
    id
    userId
    startDate
    endDate
    planId
    notes
    completed
    active
    days {
        order
        date
        isRest
        workoutSessionId
        exercises {
            exerciseId
            series
            sets {
                weights
                reps
            }
            notes
        }
        extraSessionIds
        status
    }
`;

export const WEEK_LOG_DAY_FIELDS = `
    order
    date
    isRest
    workoutSessionId
    exercises {
        exerciseId
        series
        sets {
            weights
            reps
        }
        notes
    }
    extraSessionIds
    status
`;

export const FIND_ACTIVE_WEEK_LOG = gql`
    query findActiveWeekLog {
        activeWeekLog {
            hasActiveWeek
            week {
                id
                startDate
                endDate
                userId
                days {
                    order
                    date
                    isRest
                    workoutSessionId
                    exercises {
                        exerciseId
                        series
                        sets {
                            weights
                            reps
                        }
                        notes
                    }
                    extraSessionIds
                    status
                }
                planId
                notes
                completed
            }
        }
    }
`;

export const CREATE_WORKOUT_SESSION = gql`
    mutation CreateWorkoutSession($input: CreateWorkoutSessionInput!) {
        createWorkoutSession(createWorkoutSessionInput: $input) {
            weekLogId
            date
            routineDayId
            exercises {
                exerciseId
                series
                sets {
                    weights
                    reps
                }
                notes
            }
            status
            notes
        }
    }
`;

export const REMOVE_WORKOUT_SESSION_FROM_DAY = gql`
    mutation RemoveWorkoutSessionFromWeekDay($workoutSessionId: String!) {
        removeWorkoutSessionFromWeekDay(workoutSessionId: $workoutSessionId) {
            ${WEEK_LOG_DAY_FIELDS}
        }
    }
`;

export const CREATE_WEEK_LOG = gql`
    mutation CreateWeekLog($input: CreateWeekLogInput!) {
        createWeekLog(createWeekLogInput: $input) {
            id
            startDate
            endDate
            userId
            days {
                order
                date
                isRest
                workoutSessionId
                exercises {
                    exerciseId
                    series
                    sets {
                        weights
                        reps
                    }
                    notes
                }
                extraSessionIds
                status
            }
            planId
            notes
            completed
        }
    }
`;

export const UPDATE_WEEK_LOG_WORKOUT_SESSION = gql`
    mutation UpdateWeekLogWorkoutSession($updateWeekLogInput: UpdateWeekLogWorkoutSessionInput!) {
        updateWeekLogWorkoutSession(updateWeekLogInput: $updateWeekLogInput) {
            ${WEEK_LOG_FIELDS}
        }
    }
`;

export const UPDATE_WEEK_LOG_DAY = gql`
    mutation UpdateWeekDay($input: UpdateWeekLogDayUnifiedInput!) {
        updateWeekDay(input: $input) {
            ${WEEK_LOG_DAY_FIELDS}
        }
    }
`;

export const UPDATE_WEEK_LOG = gql`
    mutation UpdateWeekLog($input: UpdateWeekLogInput!) {
        updateWeekLog(input: $input) {
            ${WEEK_LOG_FIELDS}
        }
    }
`;

export const SYNC_WEEK_LOG_DAYS = gql`
    mutation SyncWeekLogDays($weekLogId: String!) {
        syncWeekLogDays(weekLogId: $weekLogId) {
            ${WEEK_LOG_FIELDS}
        }
    }
`;

export const ASSIGN_ROUTINE_TO_DAYS = gql`
    mutation AssignRoutineToWeekDay($routineDayId: String!, $date: String!) {
        assignRoutineToWeekDay(routineDayId: $routineDayId, date: $date) {
            ${WEEK_LOG_DAY_FIELDS}
        }
    }
`;
export const ASSIGN_ROUTINE_TO_DAY = gql`
    mutation AssignRoutineToWeekDay($routineDayId: String!, $date: String!) {
        assignRoutineToWeekDay(routineDayId: $routineDayId, date: $date) {
            ${WEEK_LOG_DAY_FIELDS}
        }
    }
`;

export const FIND_ALL_TRACKING_BY_USER = gql`
    query findAll($limit: Int, $offset: Int) {
        findAll(limit: $limit, offset: $offset) {
            ${WEEK_LOG_FIELDS}
        }
    }
`;

export const FIND_BY_ID = gql`
    query findOne($id: String!) {
        findOne(id: $id) {
            ${WEEK_LOG_FIELDS}
        }
    }
`;

export const REMOVE_EXTRA_SESSION_FROM_DAY = gql`
    mutation RemoveExtraSessionFromWeekDay($date: String!, $extraSessionId: String!) {
        removeExtraSessionFromWeekDay(date: $date, extraSessionId: $extraSessionId) {
            ${WEEK_LOG_DAY_FIELDS}
        }
    }
`;

// export const REMOVE_WORKOUT_SESSION_FROM_DAY = gql`
//     mutation RemoveWorkoutSessionFromDay($date: String!, $workoutSessionId: String!) {
//         removeWorkoutSessionFromDay(date: $date, workoutSessionId: $workoutSessionId) {
//             ${WEEK_LOG_FIELDS}
//         }
//     }
// `;

export const CREATE_ROUTINE_BY_WORKOUT = gql`
    mutation CreateRoutineByWorkout($title: String!, $exerciseIds: [String!]!) {
        createRoutineByWorkout(title: $title, exerciseIds: $exerciseIds) {
            id
            title
        }
    }
`;

export const UPDATE_DAY_WORKOUT_STATUS = gql`
    mutation UpdateWeekDayWorkoutStatus($input: UpdateDayWorkoutStatusInput!) {
        updateWeekDayWorkoutStatus(input: $input) {
            ${WEEK_LOG_DAY_FIELDS}
        }
    }
`;

export const REMOVE_WEEK_LOG = gql`
    mutation RemoveWeekLog($id: String!) {
        removeWeekLog(id: $id) {
            id
        }
    }
`;
