import { gql } from 'apollo-angular';

export const CREATE_WORKOUT_SESSION = gql`
    mutation CreateWorkoutSession($createWorkoutSessionInput: CreateWorkoutSessionInput!) {
        createWorkoutSession(createWorkoutSessionInput: $createWorkoutSessionInput) {
            id
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

export const UPDATE_WORKOUT_SESSION = gql`
    mutation UpdateWorkoutSession($updateWorkoutSessionInput: UpdateWorkoutSessionInput!) {
        updateWorkoutSession(updateWorkoutSessionInput: $updateWorkoutSessionInput) {
            id
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

export const REMOVE_WORKOUT_SESSION = gql`
    mutation RemoveWorkoutSession($id: String!) {
        removeWorkoutSession(id: $id) {
            id
            date
            status
            deleted
        }
    }
`;
