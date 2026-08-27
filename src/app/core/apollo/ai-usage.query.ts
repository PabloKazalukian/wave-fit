import { gql } from 'apollo-angular';

export const GET_AI_USAGE_STATUS = gql`
    query GetAiUsageStatus {
        aiUsageStatus {
            used
            limit
            remaining
            resetAt
        }
    }
`;
