import { gql } from 'apollo-angular';

export const GET_EXTRA_SESSION_CATALOG = gql`
    query extraSessionCatalog {
        extraSessionCatalog {
            key
            label
            category
            met
        }
    }
`;

export const GET_EXTRA_SESSIONS_BY_WORKOUT = gql`
    query extraSessionsByWorkoutSession($workoutSessionId: String!) {
        extraSessionsByWorkoutSession(workoutSessionId: $workoutSessionId) {
            id
            userId
            workoutSessionId
            category
            discipline
            date
            duration
            intensityLevel
            calories
            notes
        }
    }
`;

export const GET_EXTRA_SESSIONS_BY_IDS = gql`
    query extraSessionsByIds($ids: [String!]!) {
        extraSessionsByIds(ids: $ids) {
            id
            workoutSessionId
            category
            discipline
            date
            duration
            intensityLevel
            calories
            notes
        }
    }
`;

// export const CREATE_EXTRA_SESSION = gql`
//     mutation createExtraSession($createExtraSessionInput: CreateExtraSessionInput!) {
//         createExtraSession(createExtraSessionInput: $createExtraSessionInput) {
//             id
//             userId
//             workoutSessionId
//             category
//             discipline
//             date
//             duration
//             intensityLevel
//             calories
//             notes
//         }
//     }
// `;

export const UPDATE_EXTRA_SESSION = gql`
    mutation updateExtraSession($updateExtraSessionInput: UpdateExtraSessionInput!) {
        updateExtraSession(updateExtraSessionInput: $updateExtraSessionInput) {
            id
            category
            discipline
            duration
            intensityLevel
            calories
            notes
        }
    }
`;

export const REMOVE_EXTRA_SESSION = gql`
    mutation removeExtraSession($id: String!) {
        removeExtraSession(id: $id)
    }
`;
