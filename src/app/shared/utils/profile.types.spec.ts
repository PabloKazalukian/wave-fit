import { DistributionDays, distributionToLogMode } from './profile.types';

describe('distributionToLogMode (TEST-004)', () => {
    it('maps WEEK to the week log mode', () => {
        expect(distributionToLogMode(DistributionDays.WEEK)).toBe('week');
    });

    it('maps DAY to the day log mode', () => {
        expect(distributionToLogMode(DistributionDays.DAY)).toBe('day');
    });

    it('exposes the expected enum values', () => {
        expect(DistributionDays.WEEK).toBe('week_log');
        expect(DistributionDays.DAY).toBe('day_log');
    });
});
