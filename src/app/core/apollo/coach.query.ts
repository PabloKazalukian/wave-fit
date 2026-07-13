import { gql } from 'apollo-angular';

export const GENERATE_PLAN = gql`
    mutation GeneratePlan {
        generatePlan {
            id
            title
            description
            focus
            status
            startDate
            endDate
            durationWeeks
            trainingDaysPerWeek
            overallAdherencePercent
            totalSessionsCompleted
            totalSessionsPlanned
            version
            tags
            createdAt
            updatedAt
            aiSnapshot {
                contextSentToAI
                promptUsed
                modelUsed
                rawResponse
                tokensUsed
                generatedAt
            }
        }
    }
`;

export const GENERATE_PLAN_2 = gql`
    mutation GeneratePlan {
        generatePlan {
            id
            title
            focus
            status
            startDate
            endDate
            durationWeeks
            trainingDaysPerWeek
            totalSessionsPlanned
            aiSnapshot {
                modelUsed
                tokensUsed
                generatedAt
            }
        }
    }
`;

export const GET_TRAINING_PLANS = gql`
    query GetTrainingPlans {
        trainingPlans {
            id
            title
            focus
            status
            durationWeeks
            trainingDaysPerWeek
            createdAt
        }
    }
`;

export const GET_TRAINING_PLAN = gql`
    query GetTrainingPlan($id: String!) {
        trainingPlan(id: $id) {
            id
            title
            description
            focus
            status
            startDate
            endDate
            durationWeeks
            trainingDaysPerWeek
            tags
            aiSnapshot {
                modelUsed
                tokensUsed
            }
        }
    }
`;

export const CREATE_TRAINING_PLAN = gql`
    mutation CreateTrainingPlan($input: CreateTrainingPlanInput!) {
        createTrainingPlan(createTrainingPlanInput: $input) {
            id
            title
        }
    }
`;

export const UPDATE_TRAINING_PLAN = gql`
    mutation UpdateTrainingPlan($input: UpdateTrainingPlanInput!) {
        updateTrainingPlan(updateTrainingPlanInput: $input) {
            id
            title
        }
    }
`;

export const REMOVE_TRAINING_PLAN = gql`
    mutation RemoveTrainingPlan($id: String!) {
        removeTrainingPlan(id: $id) {
            id
        }
    }
`;
