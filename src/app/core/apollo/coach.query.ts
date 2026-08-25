import { gql } from 'apollo-angular';

export const GENERATE_PLAN = gql`
    mutation GeneratePlan($comment: String!) {
        generatePlan(comment: $comment) {
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
            aiSnapshot {
                rawResponse
            }
            version
            createdAt
            updatedAt
        }
    }
`;

export const GET_TRAINING_PLANS = gql`
    query GetTrainingPlans($limit: Int!, $offset: Int!) {
        trainingPlans(limit: $limit, offset: $offset) {
            items {
                id
                title
                focus
                status
                confirmed
                createdAt
            }
            total
            limit
            offset
            totalPages
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
    mutation ConfirmPlan($id: String!, $action: PlanConfirmationAction!) {
        confirmPlan(id: $id, action: $action) {
            trainingPlan {
                id
                title
                confirmed
                status
                confirmedAction
                resultingWeekLogId
                resultingRoutinePlanId
            }
            weekLog {
                id
                startDate
                endDate
                days {
                    order
                    date
                    isRest
                    workoutSessionId
                    exercises {
                        exerciseId
                        series
                    }
                }
            }
            routinePlan {
                id
                name
                description
                weekly_distribution
                isAiGenerated
                generatedFromPlanId
                createdBy
                routineDays {
                    id
                    title
                    type
                    exercises {
                        exercise {
                            id
                            name
                            category
                        }
                        order
                    }
                }
            }
        }
    }
`;
