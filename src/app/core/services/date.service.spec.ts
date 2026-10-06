import { TestBed } from '@angular/core/testing';
import { format, parseISO, subDays } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

import { DateService } from './date.service';

const TZ = 'America/Argentina/Buenos_Aires';

describe('DateService (TEST-005)', () => {
    let service: DateService;

    const todayInTz = (): string => formatInTimeZone(new Date(), TZ, 'yyyy-MM-dd');

    const expectedFrom = (days: number): string =>
        format(subDays(parseISO(todayInTz()), days - 1), 'yyyy-MM-dd');

    beforeEach(() => {
        const resolved = new Intl.DateTimeFormat('en-US', { timeZone: TZ }).resolvedOptions();
        spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').and.returnValue(resolved);
        TestBed.configureTestingModule({});
        service = TestBed.inject(DateService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('isValidLocalDate', () => {
        it('accepts real calendar dates', () => {
            expect(service.isValidLocalDate('2026-02-28')).toBeTrue();
            expect(service.isValidLocalDate('2026-12-31')).toBeTrue();
            expect(service.isValidLocalDate('2024-02-29')).toBeTrue();
        });

        it('rejects calendar impossibilities', () => {
            expect(service.isValidLocalDate('2026-02-30')).toBeFalse();
            expect(service.isValidLocalDate('2026-13-01')).toBeFalse();
            expect(service.isValidLocalDate('2025-02-29')).toBeFalse();
            expect(service.isValidLocalDate('2026-04-31')).toBeFalse();
            expect(service.isValidLocalDate('2026-00-10')).toBeFalse();
        });

        it('rejects wrong shapes and non-strings', () => {
            expect(service.isValidLocalDate('2026-1-1')).toBeFalse();
            expect(service.isValidLocalDate('26-01-01')).toBeFalse();
            expect(service.isValidLocalDate('2026/01/01')).toBeFalse();
            expect(service.isValidLocalDate('')).toBeFalse();
            expect(service.isValidLocalDate('ayer')).toBeFalse();
            expect(service.isValidLocalDate(null)).toBeFalse();
            expect(service.isValidLocalDate(undefined)).toBeFalse();
        });
    });

    describe('daysBetween', () => {
        it('is inclusive-free', () => {
            expect(service.daysBetween('2026-01-01', '2026-01-01')).toBe(0);
            expect(service.daysBetween('2026-01-01', '2026-01-02')).toBe(1);
            expect(service.daysBetween('2026-01-01', '2026-01-31')).toBe(30);
        });

        it('is signed', () => {
            expect(service.daysBetween('2026-01-02', '2026-01-01')).toBe(-1);
            expect(service.daysBetween('2026-03-01', '2026-02-01')).toBe(-28);
        });

        it('crosses month, year and leap boundaries', () => {
            expect(service.daysBetween('2026-01-31', '2026-02-01')).toBe(1);
            expect(service.daysBetween('2025-12-31', '2026-01-01')).toBe(1);
            expect(service.daysBetween('2024-02-28', '2024-03-01')).toBe(2);
        });
    });

    describe('lastNDays', () => {
        it('returns a 29-day span ending today for 30 days', () => {
            const range = service.lastNDays(30);

            expect(range.to).toBe(todayInTz());
            expect(service.daysBetween(range.from, range.to)).toBe(29);
            expect(range.from).toBe(expectedFrom(30));
        });

        it('returns from = today - (days - 1)', () => {
            expect(service.lastNDays(1)).toEqual({ from: todayInTz(), to: todayInTz() });

            const seven = service.lastNDays(7);
            expect(seven.from).toBe(expectedFrom(7));
            expect(service.daysBetween(seven.from, seven.to)).toBe(6);

            const max = service.lastNDays(120);
            expect(max.from).toBe(expectedFrom(120));
            expect(service.daysBetween(max.from, max.to)).toBe(119);
        });

        it('honours an explicit timezone', () => {
            const range = service.lastNDays(30, 'Asia/Tokyo');

            expect(range.to).toBe(formatInTimeZone(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd'));
        });
    });

    describe('isoWeekStartLocalDate', () => {
        it('returns the Monday of an ISO week', () => {
            expect(service.isoWeekStartLocalDate('2026-W40')).toBe('2026-09-28');
            expect(service.isoWeekStartLocalDate('2026-W9')).toBe('2026-02-23');
            expect(service.isoWeekStartLocalDate('2026-W01')).toBe('2025-12-29');
        });

        it('returns null for malformed keys', () => {
            expect(service.isoWeekStartLocalDate('2026W40')).toBeNull();
            expect(service.isoWeekStartLocalDate('2026-w40')).toBeNull();
            expect(service.isoWeekStartLocalDate('2026-W0')).toBeNull();
            expect(service.isoWeekStartLocalDate('2026-W99')).toBeNull();
            expect(service.isoWeekStartLocalDate('2026-W')).toBeNull();
            expect(service.isoWeekStartLocalDate('')).toBeNull();
            expect(service.isoWeekStartLocalDate('semana 40')).toBeNull();
        });

        it('returns null for an ISO week the year does not have', () => {
            expect(service.isoWeekStartLocalDate('2025-W53')).toBeNull();
            expect(service.isoWeekStartLocalDate('2026-W53')).not.toBeNull();
        });
    });
});
