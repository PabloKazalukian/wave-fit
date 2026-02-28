import { gql } from 'apollo-angular';

export const GET_PLANS = gql`
    query {
        plans {
            id
            name
            description
            duration
        }
    }
`;

export const CREATE_ROUTINE_PLAN = gql`
    mutation CreateRoutinePlan($input: CreateRoutinePlanInput!) {
        createRoutinePlan(createRoutinePlanInput: $input) {
            id
            name
            description
            weekly_distribution
            routineDays {
                id
            }
            createdBy
        }
    }
`;

export const GET_ROUTINE_PLAN = gql`
    query GetRoutinePlan($id: String!) {
        routinePlan(id: $id) {
            id
            name
            description
            weekly_distribution
            routineDays {
                id
                title
                type
                exercises {
                    id
                    name
                    category
                }
            }
            createdBy
        }
    }
`;

export const IS_ROUTINE_TITLE_AVAILABLE = gql`
    query IsRoutineTitleAvailable($input: ValidateTitleInput!) {
        isRoutineTitleAvailable(title: $input)
    }
`;
