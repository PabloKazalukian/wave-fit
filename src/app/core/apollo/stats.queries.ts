import { gql } from 'apollo-angular';

export const GET_TOP_EXERCISES = gql`
    query GetTopExercises {
        getTopExercises {
            id
            userId
            computedAt
            exercises {
                rank
                exerciseId
                name
                category
                totalSessions
                totalVolume
                avgVolumePerSession
            }
        }
    }
`;

export const GET_TOP_ROUTINES = gql`
    query GetTopRoutines {
        getTopRoutines {
            id
            userId
            computedAt
            routines {
                rank
                planId
                name
                totalWeeks
                totalSessions
                adherenceRate
            }
        }
    }
`;

export const GET_PERSONAL_RECORDS = gql`
    query GetPersonalRecords {
        getPersonalRecords {
            id
            userId
            computedAt
            records {
                exerciseId
                exerciseName
                category
                oneRmEstimated
                bestWeight
                bestReps
                bestVolume
                achievedAt
                previousOneRm
            }
        }
    }
`;

export const GET_ADHERENCE = gql`
    query GetAdherence {
        getAdherence {
            id
            userId
            computedAt
            weeks {
                weekStartDate
                totalDays
                completedDays
                skippedDays
                pendingDays
                adherencePercent
            }
        }
    }
`;
