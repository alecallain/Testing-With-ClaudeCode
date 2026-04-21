import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import YearView from '../YearView';
import type { Chore } from '../../../types';

// A daily chore covering all of 2026 — gives deterministic counts per month
const dailyChoreAllYear: Chore = {
  id: 'chore-daily',
  title: 'Daily Standup',
  description: '',
  assigneeIds: [],
  color: '#3b82f6',
  startDate: '2026-01-01',
  endDate: '2026-12-31',
  recurrence: { type: 'daily', daysOfWeek: [], dayOfMonth: null },
  difficulty: 1,
};

// A chore that only occurs in March 2026 (single occurrence, no recurrence)
const singleOccurrenceChore: Chore = {
  id: 'chore-single',
  title: 'Spring Cleaning',
  description: '',
  assigneeIds: [],
  color: '#10b981',
  startDate: '2026-03-15',
  endDate: null,
  recurrence: { type: 'none', daysOfWeek: [], dayOfMonth: null },
  difficulty: 2,
};

function renderYearView(overrides: {
  chores?: Chore[];
  currentYear?: number;
  onNavigateYear?: (direction: 'prev' | 'next') => void;
  onSelectMonth?: (date: Date) => void;
  onSwitchToMonth?: () => void;
} = {}) {
  const props = {
    chores: overrides.chores ?? [],
    currentYear: overrides.currentYear ?? 2026,
    onNavigateYear: overrides.onNavigateYear ?? vi.fn(),
    onSelectMonth: overrides.onSelectMonth ?? vi.fn(),
    onSwitchToMonth: overrides.onSwitchToMonth ?? vi.fn(),
  };
  return { ...render(<YearView {...props} />), props };
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April',
  'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December',
];

// Days per month in 2026 (non-leap year)
const DAYS_IN_2026: number[] = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

describe('YearView', () => {
  describe('month grid rendering', () => {
    it('renders all 12 month names', () => {
      renderYearView();
      for (const name of MONTH_NAMES) {
        expect(screen.getByText(name)).toBeInTheDocument();
      }
    });

    it('renders the current year in the header', () => {
      renderYearView({ currentYear: 2026 });
      expect(screen.getByText('2026')).toBeInTheDocument();
    });

    it('renders exactly 12 month cards as buttons', () => {
      renderYearView();
      // Each month card has an aria-label of the form "MonthName 2026: N occurrence(s)"
      const monthButtons = MONTH_NAMES.map(name =>
        screen.getByRole('button', { name: new RegExp(`^${name} 2026:`) })
      );
      expect(monthButtons).toHaveLength(12);
    });
  });

  describe('occurrence counts', () => {
    it('shows the correct occurrence count for each month with a daily chore spanning all year', () => {
      renderYearView({ chores: [dailyChoreAllYear], currentYear: 2026 });
      for (let i = 0; i < 12; i++) {
        const expectedCount = DAYS_IN_2026[i];
        const monthName = MONTH_NAMES[i];
        // The aria-label encodes the count
        expect(
          screen.getByRole('button', {
            name: `${monthName} 2026: ${expectedCount} occurrences`,
          })
        ).toBeInTheDocument();
        // The count is also rendered as visible text in a <span>
        // Multiple months may share the same count (e.g. both Jan and March have 31),
        // so check the aria-label-scoped button rather than bare getByText.
      }
    });

    it('shows count 1 for the month containing a single-occurrence chore and 0 elsewhere', () => {
      renderYearView({ chores: [singleOccurrenceChore], currentYear: 2026 });
      // March should have 1 occurrence
      expect(
        screen.getByRole('button', { name: 'March 2026: 1 occurrence' })
      ).toBeInTheDocument();
      // All other months should have 0
      const otherMonths = MONTH_NAMES.filter(n => n !== 'March');
      for (const name of otherMonths) {
        expect(
          screen.getByRole('button', { name: `${name} 2026: 0 occurrences` })
        ).toBeInTheDocument();
      }
    });

    it('shows the correct count with multiple chores', () => {
      renderYearView({
        chores: [singleOccurrenceChore, singleOccurrenceChore],
        currentYear: 2026,
      });
      // Two identical chores both occurring on March 15 → March count = 2
      expect(
        screen.getByRole('button', { name: 'March 2026: 2 occurrences' })
      ).toBeInTheDocument();
    });

    it('uses singular "occurrence" label when count is exactly 1', () => {
      renderYearView({ chores: [singleOccurrenceChore], currentYear: 2026 });
      expect(
        screen.getByRole('button', { name: 'March 2026: 1 occurrence' })
      ).toBeInTheDocument();
    });

    it('uses plural "occurrences" label when count is 0', () => {
      renderYearView({ chores: [], currentYear: 2026 });
      expect(
        screen.getByRole('button', { name: 'January 2026: 0 occurrences' })
      ).toBeInTheDocument();
    });
  });

  describe('zero-count months', () => {
    it('renders all 12 months without crashing when no chores are provided', () => {
      renderYearView({ chores: [] });
      expect(screen.getAllByRole('button', { name: /2026: 0 occurrences/i })).toHaveLength(12);
    });

    it('shows the month name for zero-count months', () => {
      renderYearView({ chores: [] });
      expect(screen.getByText('February')).toBeInTheDocument();
      expect(screen.getByText('November')).toBeInTheDocument();
    });
  });

  describe('month card click — onSelectMonth', () => {
    it('calls onSelectMonth with the correct Date when a month card is clicked', async () => {
      const user = userEvent.setup();
      const onSelectMonth = vi.fn();
      renderYearView({ onSelectMonth, currentYear: 2026 });
      await user.click(screen.getByRole('button', { name: /^January 2026:/ }));
      expect(onSelectMonth).toHaveBeenCalledOnce();
      const called = onSelectMonth.mock.calls[0][0] as Date;
      expect(called.getFullYear()).toBe(2026);
      expect(called.getMonth()).toBe(0); // January = 0
    });

    it('calls onSelectMonth with month index 2 when March is clicked', async () => {
      const user = userEvent.setup();
      const onSelectMonth = vi.fn();
      renderYearView({ onSelectMonth, currentYear: 2026 });
      await user.click(screen.getByRole('button', { name: /^March 2026:/ }));
      const called = onSelectMonth.mock.calls[0][0] as Date;
      expect(called.getMonth()).toBe(2);
      expect(called.getFullYear()).toBe(2026);
    });

    it('calls onSelectMonth with month index 11 when December is clicked', async () => {
      const user = userEvent.setup();
      const onSelectMonth = vi.fn();
      renderYearView({ onSelectMonth, currentYear: 2026 });
      await user.click(screen.getByRole('button', { name: /^December 2026:/ }));
      const called = onSelectMonth.mock.calls[0][0] as Date;
      expect(called.getMonth()).toBe(11);
      expect(called.getFullYear()).toBe(2026);
    });

    it('passes the correct year in onSelectMonth when currentYear is not 2026', async () => {
      const user = userEvent.setup();
      const onSelectMonth = vi.fn();
      renderYearView({ onSelectMonth, currentYear: 2025 });
      await user.click(screen.getByRole('button', { name: /^June 2025:/ }));
      const called = onSelectMonth.mock.calls[0][0] as Date;
      expect(called.getFullYear()).toBe(2025);
      expect(called.getMonth()).toBe(5); // June = 5
    });
  });

  describe('year navigation', () => {
    it('calls onNavigateYear("prev") when the previous year button is clicked', async () => {
      const user = userEvent.setup();
      const onNavigateYear = vi.fn();
      renderYearView({ onNavigateYear });
      await user.click(screen.getByRole('button', { name: /previous year/i }));
      expect(onNavigateYear).toHaveBeenCalledOnce();
      expect(onNavigateYear).toHaveBeenCalledWith('prev');
    });

    it('calls onNavigateYear("next") when the next year button is clicked', async () => {
      const user = userEvent.setup();
      const onNavigateYear = vi.fn();
      renderYearView({ onNavigateYear });
      await user.click(screen.getByRole('button', { name: /next year/i }));
      expect(onNavigateYear).toHaveBeenCalledOnce();
      expect(onNavigateYear).toHaveBeenCalledWith('next');
    });

    it('does not call onNavigateYear when a month card is clicked', async () => {
      const user = userEvent.setup();
      const onNavigateYear = vi.fn();
      renderYearView({ onNavigateYear });
      await user.click(screen.getByRole('button', { name: /^April 2026:/ }));
      expect(onNavigateYear).not.toHaveBeenCalled();
    });
  });

  describe('view switch — onSwitchToMonth', () => {
    it('calls onSwitchToMonth when the "Month" button is clicked', async () => {
      const user = userEvent.setup();
      const onSwitchToMonth = vi.fn();
      renderYearView({ onSwitchToMonth });
      await user.click(screen.getByRole('button', { name: 'Month' }));
      expect(onSwitchToMonth).toHaveBeenCalledOnce();
    });

    it('does not call onSwitchToMonth when a month card is clicked', async () => {
      const user = userEvent.setup();
      const onSwitchToMonth = vi.fn();
      renderYearView({ onSwitchToMonth });
      await user.click(screen.getByRole('button', { name: /^July 2026:/ }));
      expect(onSwitchToMonth).not.toHaveBeenCalled();
    });
  });
});
