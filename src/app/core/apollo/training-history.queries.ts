import { gql } from 'apollo-angular';

export const GET_TRAINING_CALENDAR = gql`
    query TrainingCalendar($input: TrainingCalendarInput!) {
        trainingCalendar(input: $input) {
            year
            month
            days {
                date
                type
                status
                workoutSessionId
                extraSessionIds
                weekLogReference {
                    id
                    startDate
                    endDate
                    completed
                    active
                    notes
                }
            }
        }
    }
`;
