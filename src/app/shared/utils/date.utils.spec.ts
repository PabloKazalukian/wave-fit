import { apiDateTimeToLocalDate, isoWeekStartLocalDateFromKey, localDateToUtc } from './date.utils';

describe('date.utils apiDateTimeToLocalDate (TEST-006)', () => {
    const ISO_MORNING_UTC = '2026-05-01T02:30:00.000Z';
    const ISO_LATE_UTC = '2026-05-01T23:30:00.000Z';

    const pinRuntimeTimezone = (timeZone: string): void => {
        const resolved = new Intl.DateTimeFormat('en-US', { timeZone }).resolvedOptions();
        spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').and.returnValue(resolved);
    };

    it('resolves the same instant to different LocalDates per timezone', () => {
        expect(apiDateTimeToLocalDate(ISO_MORNING_UTC, 'America/Argentina/Buenos_Aires')).toBe(
            '2026-04-30',
        );
        expect(apiDateTimeToLocalDate(ISO_MORNING_UTC, 'Asia/Tokyo')).toBe('2026-05-01');
    });

    it('defaults to the runtime timezone resolved at call time', () => {
        pinRuntimeTimezone('Asia/Tokyo');

        expect(apiDateTimeToLocalDate(ISO_LATE_UTC)).toBe('2026-05-02');
    });

    it('handles Z, explicit offsets and millisecond precision', () => {
        expect(apiDateTimeToLocalDate('2026-05-01T02:30:00Z', 'UTC')).toBe('2026-05-01');
        expect(apiDateTimeToLocalDate('2026-05-01T02:30:00.000Z', 'UTC')).toBe('2026-05-01');
        expect(apiDateTimeToLocalDate('2026-05-01T02:30:00+05:00', 'UTC')).toBe('2026-04-30');
    });
});

describe('date.utils localDateToUtc (regression)', () => {
    it('converts a LocalDate to the start of that day in the given timezone', () => {
        const utc = localDateToUtc('2026-05-01', 'UTC');

        expect(utc.toISOString()).toBe('2026-05-01T00:00:00.000Z');
    });
});

describe('date.utils isoWeekStartLocalDateFromKey (TEST-005 parity)', () => {
    it('returns the Monday of the given ISO week', () => {
        expect(isoWeekStartLocalDateFromKey('2026-W40')).toBe('2026-09-28');
    });

    it('handles the first and last ISO week of a year', () => {
        expect(isoWeekStartLocalDateFromKey('2026-W01')).toBe('2025-12-29');
        expect(isoWeekStartLocalDateFromKey('2020-W53')).toBe('2020-12-28');
    });

    it('returns null for an ISO week the year does not have', () => {
        expect(isoWeekStartLocalDateFromKey('2025-W53')).toBeNull();
    });

    it('returns null for a malformed or out-of-range key', () => {
        expect(isoWeekStartLocalDateFromKey('semana 40')).toBeNull();
        expect(isoWeekStartLocalDateFromKey('2026-W00')).toBeNull();
        expect(isoWeekStartLocalDateFromKey('2026-W54')).toBeNull();
        expect(isoWeekStartLocalDateFromKey('2026-40')).toBeNull();
    });
});
