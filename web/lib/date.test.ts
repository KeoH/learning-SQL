import { describe, it, expect } from 'vitest';
import { formatRelativeTime } from './date';

describe('formatRelativeTime', () => {
    const now = Date.now();

    it('returns "hace unos segundos" for < 60s', () => {
        expect(formatRelativeTime(now - 10000)).toBe('hace unos segundos');
    });

    it('returns minutes correctly', () => {
        expect(formatRelativeTime(now - 60 * 1000)).toBe('hace 1 min');
        expect(formatRelativeTime(now - 5 * 60 * 1000)).toBe('hace 5 min');
    });

    it('returns hours correctly', () => {
        expect(formatRelativeTime(now - 60 * 60 * 1000)).toBe('hace 1 hora');
        expect(formatRelativeTime(now - 2 * 60 * 60 * 1000)).toBe('hace 2 horas');
    });

    it('returns days correctly', () => {
        expect(formatRelativeTime(now - 24 * 60 * 60 * 1000)).toBe('hace 1 día');
        expect(formatRelativeTime(now - 2 * 24 * 60 * 60 * 1000)).toBe('hace 2 días');
    });

    it('returns weeks correctly', () => {
        expect(formatRelativeTime(now - 7 * 24 * 60 * 60 * 1000)).toBe('hace 1 semana');
        expect(formatRelativeTime(now - 14 * 24 * 60 * 60 * 1000)).toBe('hace 2 semanas');
    });
});
