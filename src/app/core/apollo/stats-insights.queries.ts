import { gql } from 'apollo-angular';

/**
 * Queries del namespace `stats-charts` de wave-fit-api.
 *
 * Las seis comparten el mismo input (`StatsChartsInput`) y se ejecutan on demand
 * para el rango elegido — a diferencia de `stats.queries.ts`, cuyos resultados
 * son snapshots pre-computados por el worker.
 *
 * Cada selección lista exactamente los campos que el backend expone: pedir uno
 * inexistente hace fallar la query completa.
 */

export const GET_STATS_1RM_WEEKLY = gql`
    query GetStats1RmWeekly($input: StatsChartsInput!) {
        getStats1RmWeekly(input: $input) {
            exerciseId
            name
            category
            weeks {
                weekKey
                best1RM
                weightUsed
                reps
                participated
            }
        }
    }
`;

export const GET_STATS_VOLUME_WEEKLY = gql`
    query GetStatsVolumeWeekly($input: StatsChartsInput!) {
        getStatsVolumeWeekly(input: $input) {
            weekKey
            exercises {
                exerciseId
                name
                category
                volume
            }
            muscles {
                muscle
                sets
                volume
            }
        }
    }
`;

export const GET_STATS_VOLUME_TOTAL_WEEKLY = gql`
    query GetStatsVolumeTotalWeekly($input: StatsChartsInput!) {
        getStatsVolumeTotalWeekly(input: $input) {
            weekKey
            totalVolume
            deltaPct
            possibleDeload
        }
    }
`;

export const GET_STATS_CALORIES_WEEKLY = gql`
    query GetStatsCaloriesWeekly($input: StatsChartsInput!) {
        getStatsCaloriesWeekly(input: $input) {
            weekKey
            routineKcal
            extraKcal
            totalKcal
            estimatedSessions
        }
    }
`;

export const GET_STATS_FORGOTTEN_MUSCLES = gql`
    query GetStatsForgottenMuscles($input: StatsChartsInput!) {
        getStatsForgottenMuscles(input: $input) {
            muscle
            totalSets
            weeksWithoutWork
            lastTrainedAt
        }
    }
`;

export const GET_STATS_EXERCISE_TREND = gql`
    query GetStatsExerciseTrend($input: StatsChartsInput!) {
        getStatsExerciseTrend(input: $input) {
            exerciseId
            name
            category
            slope
            pctChange
            label
            weeksUsed
        }
    }
`;
