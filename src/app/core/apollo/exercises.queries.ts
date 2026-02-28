import { gql } from 'apollo-angular';

export const GET_EXERCISES = gql`
    query {
        exercises {
            id
            name
            category
            usesWeight
        }
    }
`;

export const CREATE_EXERCISE = gql`
    mutation CreateExercise($input: CreateExerciseInput!) {
        createExercise(createExerciseInput: $input) {
            id
            name
            category
            usesWeight
        }
    }
`;
