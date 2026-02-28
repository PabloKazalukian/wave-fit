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
                extraSessionIds
                status
            }
            planId
            notes
            completed
        }
    }
`;

export const UPDATE_WEEK_LOG = gql`
    mutation UpdateWeekLog($updateWeekLogInput: UpdateWeekLogInput!) {
        updateWeekLog(updateWeekLogInput: $updateWeekLogInput) {
            ${WEEK_LOG_FIELDS}
        }
    }
`;

export const UPDATE_WEEK_LOG_DAY = gql`
    mutation UpdateWeekLogDay($input: UpdateWeekLogDayInput!) {
        updateWeekLogDay(input: $input) {
            ${WEEK_LOG_FIELDS}
        }
    }
`;
