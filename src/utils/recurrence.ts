import {
  parseISO,
  isWithinInterval,
  addDays,
  addMonths,
  setDate,
  startOfMonth,
  endOfMonth,
  isBefore,
  isAfter,
  format,
} from 'date-fns';
import type { Chore } from '../types';

/**
 * Returns all occurrence dates (as "YYYY-MM-DD" strings) for a chore
 * that fall within [rangeStart, rangeEnd] (inclusive).
 */
export function getOccurrencesInRange(
  chore: Chore,
  rangeStart: Date,
  rangeEnd: Date,
): string[] {
  const choreStart = parseISO(chore.startDate);
  const choreEnd = chore.endDate ? parseISO(chore.endDate) : null;

  // Effective range is the intersection of chore lifetime and requested range
  const effectiveStart = isAfter(choreStart, rangeStart) ? choreStart : rangeStart;
  const effectiveEnd = choreEnd && isBefore(choreEnd, rangeEnd) ? choreEnd : rangeEnd;

  if (isAfter(effectiveStart, effectiveEnd)) return [];

  const interval = { start: effectiveStart, end: effectiveEnd };
  const results: string[] = [];

  switch (chore.recurrence.type) {
    case 'none': {
      if (isWithinInterval(choreStart, interval)) {
        results.push(format(choreStart, 'yyyy-MM-dd'));
      }
      break;
    }
    case 'daily': {
      let current = effectiveStart;
      while (!isAfter(current, effectiveEnd)) {
        results.push(format(current, 'yyyy-MM-dd'));
        current = addDays(current, 1);
      }
      break;
    }
    case 'weekly': {
      const { daysOfWeek } = chore.recurrence;
      if (daysOfWeek.length === 0) break;
      let current = effectiveStart;
      while (!isAfter(current, effectiveEnd)) {
        if (daysOfWeek.includes(current.getDay())) {
          results.push(format(current, 'yyyy-MM-dd'));
        }
        current = addDays(current, 1);
      }
      break;
    }
    case 'monthly': {
      const day = chore.recurrence.dayOfMonth ?? choreStart.getDate();
      // Walk month by month
      let monthCursor = startOfMonth(effectiveStart);
      while (!isAfter(monthCursor, effectiveEnd)) {
        const monthEnd = endOfMonth(monthCursor);
        // Clamp day to end of month (e.g. day 31 in Feb → Feb 28/29)
        const clampedDay = Math.min(day, monthEnd.getDate());
        const occurrence = setDate(monthCursor, clampedDay);
        if (isWithinInterval(occurrence, interval)) {
          results.push(format(occurrence, 'yyyy-MM-dd'));
        }
        monthCursor = addMonths(monthCursor, 1);
      }
      break;
    }
  }

  return results;
}
