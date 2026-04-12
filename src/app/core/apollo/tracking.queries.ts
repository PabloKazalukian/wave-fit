import { gql } from 'apollo-angular';

export const WEEK_LOG_FIELDS = `
    id
    userId
    startDate
    endDate
    planId
    notes
    completed
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
    mutation RemoveWorkoutSessionFromDay($workoutSessionId: String!) {
        removeWorkoutSessionFromDay(workoutSessionId: $workoutSessionId) {
            id
            days {
                order
                workoutSessionId
                status
            }
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
    mutation UpdateDay($input: UpdateWeekLogDayUnifiedInput!) {
        updateDay(input: $input) {
            ${WEEK_LOG_FIELDS}
        }
    }
`;

export const UPDATE_WEEK_LOG = gql`
    mutation UpdateWeekLog($updateWeekLogInput: UpdateWeekLogInput!) {
        updateWeekLog(input: $updateWeekLogInput) {
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
    mutation AssignRoutineToDay($routineDayId: String!, $date: String!) {
        assignRoutineToDay(routineDayId: $routineDayId, date: $date) {
            ${WEEK_LOG_FIELDS}
        }
    }
`;
export const ASSIGN_ROUTINE_TO_DAY = gql`
    mutation AssignRoutineToDay($routineDayId: String!, $date: String!) {
        assignRoutineToDay(routineDayId: $routineDayId, date: $date) {
            ${WEEK_LOG_FIELDS}
        }
    }
`;

export const FIND_ALL_TRACKING_BY_USER = gql`
    query findAll {
        findAll {
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
    mutation RemoveExtraSessionFromDay($date: String!, $extraSessionId: String!) {
        removeExtraSessionFromDay(date: $date, extraSessionId: $extraSessionId) {
            ${WEEK_LOG_FIELDS}
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
