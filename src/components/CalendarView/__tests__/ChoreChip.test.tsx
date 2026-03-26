import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChoreChip from '../ChoreChip';
import type { Chore, Member } from '../../../types';

const baseChore: Chore = {
  id: 'chore-1',
  title: 'Wash dishes',
  description: 'Clean all the dishes in the sink',
  assigneeId: 'member-1',
  color: '#3b82f6',
  startDate: '2026-03-01',
  endDate: null,
  recurrence: { type: 'daily', daysOfWeek: [], dayOfMonth: null },
  difficulty: 3,
};

const assignee: Member = {
  id: 'member-1',
  name: 'Alice Johnson',
  color: '#10b981',
};

function renderChip(overrides: {
  chore?: Partial<Chore>;
  assignee?: Member | null;
  done?: boolean;
  onToggleDone?: () => void;
  onEdit?: () => void;
} = {}) {
  const props = {
    chore: { ...baseChore, ...overrides.chore },
    date: '2026-03-23',
    assignee: overrides.assignee !== undefined ? overrides.assignee : assignee,
    done: overrides.done ?? false,
    onToggleDone: overrides.onToggleDone ?? vi.fn(),
    onEdit: overrides.onEdit ?? vi.fn(),
  };
  return { ...render(<ChoreChip {...props} />), props };
}

describe('ChoreChip', () => {
  describe('chip button rendering', () => {
    it('renders the chore title', () => {
      renderChip();
      expect(screen.getByRole('button', { name: /wash dishes/i })).toBeInTheDocument();
    });

    it('applies the chore color as background', () => {
      renderChip();
      const btn = screen.getByRole('button', { name: /wash dishes/i });
      expect(btn).toHaveStyle({ backgroundColor: '#3b82f6' });
    });

    it('shows a checkmark when done', () => {
      renderChip({ done: true });
      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('does not show a checkmark when not done', () => {
      renderChip({ done: false });
      expect(screen.queryByText('✓')).not.toBeInTheDocument();
    });

    it('shows assignee initials when an assignee is provided', () => {
      renderChip({ assignee });
      // "Alice Johnson" → "AJ"
      expect(screen.getByText('AJ')).toBeInTheDocument();
    });

    it('does not render assignee badge when assignee is null', () => {
      renderChip({ assignee: null });
      expect(screen.queryByText('AJ')).not.toBeInTheDocument();
    });

    it('uses chore title as the button title attribute for truncation tooltip', () => {
      renderChip();
      expect(screen.getByRole('button', { name: /wash dishes/i })).toHaveAttribute('title', 'Wash dishes');
    });
  });

  describe('popover toggle', () => {
    it('popover is hidden initially', () => {
      renderChip();
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });

    it('opens popover on chip click', async () => {
      const user = userEvent.setup();
      renderChip();
      await user.click(screen.getByRole('button', { name: /wash dishes/i }));
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    it('closes popover on second chip click', async () => {
      const user = userEvent.setup();
      renderChip();
      const chipBtn = screen.getByRole('button', { name: /wash dishes/i });
      await user.click(chipBtn);
      await user.click(chipBtn);
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });

    it('closes popover when clicking outside', async () => {
      const user = userEvent.setup();
      renderChip();
      await user.click(screen.getByRole('button', { name: /wash dishes/i }));
      expect(screen.getByText('Edit')).toBeInTheDocument();
      await user.click(document.body);
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });
  });

  describe('popover content', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      renderChip();
      await user.click(screen.getByRole('button', { name: /wash dishes/i }));
    });

    it('shows the chore title in the popover', () => {
      // There are two elements with the title text (chip span + popover heading)
      expect(screen.getAllByText('Wash dishes').length).toBeGreaterThanOrEqual(2);
    });

    it('shows the description', () => {
      expect(screen.getByText('Clean all the dishes in the sink')).toBeInTheDocument();
    });

    it('shows the assignee name', () => {
      expect(screen.getByText(/Alice Johnson/)).toBeInTheDocument();
    });

    it('shows "Mark as done" button when not done', async () => {
      expect(screen.getByRole('button', { name: /mark as done/i })).toBeInTheDocument();
    });
  });

  describe('popover — difficulty indicator', () => {
    it('shows the correct number of filled dots for the difficulty', async () => {
      const user = userEvent.setup();
      renderChip({ chore: { difficulty: 3 } });
      await user.click(screen.getByRole('button', { name: /wash dishes/i }));
      expect(screen.getByText(/●●●○○/)).toBeInTheDocument();
    });

    it('shows all filled dots for difficulty 5', async () => {
      const user = userEvent.setup();
      renderChip({ chore: { difficulty: 5 } });
      await user.click(screen.getByRole('button', { name: /wash dishes/i }));
      expect(screen.getByText(/●●●●●/)).toBeInTheDocument();
    });

    it('shows one filled dot for difficulty 1', async () => {
      const user = userEvent.setup();
      renderChip({ chore: { difficulty: 1 } });
      await user.click(screen.getByRole('button', { name: /wash dishes/i }));
      expect(screen.getByText(/●○○○○/)).toBeInTheDocument();
    });

    it('defaults to difficulty 1 when difficulty is missing (legacy chores)', async () => {
      const user = userEvent.setup();
      // Cast to bypass TS to simulate a legacy chore without the difficulty field
      renderChip({ chore: { difficulty: undefined as unknown as number } });
      await user.click(screen.getByRole('button', { name: /wash dishes/i }));
      expect(screen.getByText(/●○○○○/)).toBeInTheDocument();
    });

    it('shows the "difficulty" label in the popover', async () => {
      const user = userEvent.setup();
      renderChip();
      await user.click(screen.getByRole('button', { name: /wash dishes/i }));
      expect(screen.getByText(/difficulty/i)).toBeInTheDocument();
    });
  });

  describe('popover — done state', () => {
    it('shows "Mark as not done" button when done', async () => {
      const user = userEvent.setup();
      renderChip({ done: true });
      await user.click(screen.getByRole('button', { name: /wash dishes/i }));
      expect(screen.getByRole('button', { name: /mark as not done/i })).toBeInTheDocument();
    });
  });

  describe('popover — no description', () => {
    it('does not render description paragraph when description is empty', async () => {
      const user = userEvent.setup();
      renderChip({ chore: { description: '' } });
      await user.click(screen.getByRole('button', { name: /wash dishes/i }));
      // Only the title should appear inside the popover area, no description text
      expect(screen.queryByText('Clean all the dishes in the sink')).not.toBeInTheDocument();
    });
  });

  describe('popover — no assignee', () => {
    it('does not render "Assigned to" line when assignee is null', async () => {
      const user = userEvent.setup();
      renderChip({ assignee: null });
      await user.click(screen.getByRole('button', { name: /wash dishes/i }));
      expect(screen.queryByText(/assigned to/i)).not.toBeInTheDocument();
    });
  });

  describe('callbacks', () => {
    it('calls onToggleDone and closes popover when toggle button is clicked', async () => {
      const user = userEvent.setup();
      const onToggleDone = vi.fn();
      renderChip({ onToggleDone });
      await user.click(screen.getByRole('button', { name: /wash dishes/i }));
      await user.click(screen.getByRole('button', { name: /mark as done/i }));
      expect(onToggleDone).toHaveBeenCalledOnce();
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });

    it('calls onEdit and closes popover when Edit is clicked', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();
      renderChip({ onEdit });
      await user.click(screen.getByRole('button', { name: /wash dishes/i }));
      await user.click(screen.getByRole('button', { name: /edit/i }));
      expect(onEdit).toHaveBeenCalledOnce();
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles a single-word assignee name (one initial)', async () => {
      const user = userEvent.setup();
      renderChip({ assignee: { id: 'm2', name: 'Alice', color: '#fff' } });
      // single word → only the first character as initial
      expect(screen.getByText('A')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: /wash dishes/i }));
      expect(screen.getByText(/Alice/)).toBeInTheDocument();
    });

    it('shows at most 2 characters for initials on a long name', () => {
      renderChip({ assignee: { id: 'm3', name: 'Mary Jane Watson Parker', color: '#fff' } });
      expect(screen.getByText('MJ')).toBeInTheDocument();
    });

    it('renders correctly with a very long chore title (truncated in chip)', () => {
      const longTitle = 'A'.repeat(100);
      renderChip({ chore: { title: longTitle } });
      const btn = screen.getByRole('button');
      expect(btn).toHaveAttribute('title', longTitle);
    });

    it('does not call onToggleDone when popover is not open', () => {
      const onToggleDone = vi.fn();
      renderChip({ onToggleDone });
      expect(onToggleDone).not.toHaveBeenCalled();
    });

    it('does not call onEdit when popover is not open', () => {
      const onEdit = vi.fn();
      renderChip({ onEdit });
      expect(onEdit).not.toHaveBeenCalled();
    });

    it('renders a chore with no recurrence type without errors', () => {
      renderChip({
        chore: {
          recurrence: { type: 'none', daysOfWeek: [], dayOfMonth: null },
        },
      });
      expect(screen.getByRole('button', { name: /wash dishes/i })).toBeInTheDocument();
    });
  });
});
