import { gql } from 'apollo-angular';

export const GENERATE_PLAN = gql`
    mutation GeneratePlan {
        generatePlan {
            id
            userId
            goalId
            title
            description
            focus
            status
            startDate
            endDate
            durationWeeks
            trainingDaysPerWeek
            tags
            confirmed
            version
            createdAt
            updatedAt
        }
    }
`;

export const GET_TRAINING_PLANS = gql`
    query GetTrainingPlans {
        trainingPlans {
            id
            title
            description
            focus # hypertrophy | strength | endurance | fat_loss | recomp | maintenance | sport_specific
            status # draft | active | completed | abandoned | archived
            startDate
            endDate
            durationWeeks
            trainingDaysPerWeek
            overallAdherencePercent
            totalSessionsCompleted
            totalSessionsPlanned
            confirmed
            tags
            version
            goalId
            createdAt
            updatedAt
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
                rawResponse
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

export const CONFIRM_PLAN = gql`
    mutation ConfirmPlan($id: String!) {
        confirmPlan(id: $id) {
            id
            title
            confirmed
            status
            updatedAt
        }
    }
`;
