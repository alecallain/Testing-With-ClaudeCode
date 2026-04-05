import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChoreChip from '../ChoreChip';
import type { Chore, Member } from '../../../types';

const baseChore: Chore = {
  id: 'chore-1',
  title: 'Wash dishes',
  description: 'Clean all the dishes in the sink',
  assigneeIds: ['member-1'],
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

const bob: Member = {
  id: 'member-2',
  name: 'Bob Smith',
  color: '#3b82f6',
};

function renderChip(overrides: {
  chore?: Partial<Chore>;
  assignees?: Member[];
  allMembers?: Member[];
  done?: boolean;
  onToggleDone?: () => void;
  onEdit?: () => void;
  onToggleAssignee?: (memberId: string) => void;
} = {}) {
  const props = {
    chore: { ...baseChore, ...overrides.chore },
    date: '2026-03-23',
    assignees: overrides.assignees !== undefined ? overrides.assignees : [assignee],
    allMembers: overrides.allMembers !== undefined ? overrides.allMembers : [assignee, bob],
    done: overrides.done ?? false,
    onToggleDone: overrides.onToggleDone ?? vi.fn(),
    onEdit: overrides.onEdit ?? vi.fn(),
    onToggleAssignee: overrides.onToggleAssignee ?? vi.fn(),
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
      renderChip({ assignees: [assignee] });
      // "Alice Johnson" → "AJ"
      expect(screen.getByText('AJ')).toBeInTheDocument();
    });

    it('shows multiple initials badges when multiple assignees', () => {
      renderChip({ assignees: [assignee, bob], allMembers: [assignee, bob] });
      expect(screen.getByText('AJ')).toBeInTheDocument();
      expect(screen.getByText('BS')).toBeInTheDocument();
    });

    it('does not render assignee badge when no assignees', () => {
      renderChip({ assignees: [] });
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
    it('does not render "Assigned to" section when no assignees', async () => {
      const user = userEvent.setup();
      renderChip({ assignees: [], allMembers: [assignee, bob] });
      await user.click(screen.getByRole('button', { name: /wash dishes/i }));
      expect(screen.queryByText(/^Assigned to$/i)).not.toBeInTheDocument();
    });

    it('shows "Assign to" heading when no assignees but members available', async () => {
      const user = userEvent.setup();
      renderChip({ assignees: [], allMembers: [assignee] });
      await user.click(screen.getByRole('button', { name: /wash dishes/i }));
      expect(screen.getByText('Assign to')).toBeInTheDocument();
    });
  });

  describe('popover — assignee management', () => {
    it('shows remove button next to each assignee', async () => {
      const user = userEvent.setup();
      renderChip({ assignees: [assignee], allMembers: [assignee, bob] });
      await user.click(screen.getByRole('button', { name: /wash dishes/i }));
      expect(screen.getByRole('button', { name: /remove alice johnson/i })).toBeInTheDocument();
    });

    it('shows "Add assignee" heading when some assignees exist and slots remain', async () => {
      const user = userEvent.setup();
      renderChip({ assignees: [assignee], allMembers: [assignee, bob] });
      await user.click(screen.getByRole('button', { name: /wash dishes/i }));
      expect(screen.getByText('Add assignee')).toBeInTheDocument();
    });

    it('shows unassigned members as add options', async () => {
      const user = userEvent.setup();
      renderChip({ assignees: [assignee], allMembers: [assignee, bob] });
      await user.click(screen.getByRole('button', { name: /wash dishes/i }));
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    });

    it('does not show "Add assignee" section when 3 assignees assigned', async () => {
      const user = userEvent.setup();
      const carol: Member = { id: 'member-3', name: 'Carol White', color: '#f59e0b' };
      renderChip({
        assignees: [assignee, bob, carol],
        allMembers: [assignee, bob, carol],
      });
      await user.click(screen.getByRole('button', { name: /wash dishes/i }));
      expect(screen.queryByText('Add assignee')).not.toBeInTheDocument();
      expect(screen.queryByText('Assign to')).not.toBeInTheDocument();
    });

    it('shows "Max 3 assignees" note when at max', async () => {
      const user = userEvent.setup();
      const carol: Member = { id: 'member-3', name: 'Carol White', color: '#f59e0b' };
      renderChip({
        assignees: [assignee, bob, carol],
        allMembers: [assignee, bob, carol],
      });
      await user.click(screen.getByRole('button', { name: /wash dishes/i }));
      expect(screen.getByText(/max 3 assignees/i)).toBeInTheDocument();
    });

    it('popover stays open after removing an assignee', async () => {
      const user = userEvent.setup();
      const onToggleAssignee = vi.fn();
      renderChip({ assignees: [assignee], allMembers: [assignee, bob], onToggleAssignee });
      await user.click(screen.getByRole('button', { name: /wash dishes/i }));
      await user.click(screen.getByRole('button', { name: /remove alice johnson/i }));
      expect(onToggleAssignee).toHaveBeenCalledWith('member-1');
      // Popover should remain open (Edit button still visible)
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    it('calls onToggleAssignee with memberId when add button clicked', async () => {
      const user = userEvent.setup();
      const onToggleAssignee = vi.fn();
      renderChip({ assignees: [assignee], allMembers: [assignee, bob], onToggleAssignee });
      await user.click(screen.getByRole('button', { name: /wash dishes/i }));
      // Bob Smith should be in the add section
      const bobRow = screen.getByText('Bob Smith').closest('button');
      await user.click(bobRow!);
      expect(onToggleAssignee).toHaveBeenCalledWith('member-2');
      // Popover should remain open
      expect(screen.getByText('Edit')).toBeInTheDocument();
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
      const singleWordMember = { id: 'm2', name: 'Alice', color: '#fff' };
      renderChip({ assignees: [singleWordMember], allMembers: [singleWordMember] });
      // single word → only the first character as initial
      expect(screen.getByText('A')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: /wash dishes/i }));
      expect(within(screen.getByText('Assigned to').parentElement!).getByText(/Alice/)).toBeInTheDocument();
    });

    it('shows at most 2 characters for initials on a long name', () => {
      const longNameMember = { id: 'm3', name: 'Mary Jane Watson Parker', color: '#fff' };
      renderChip({ assignees: [longNameMember], allMembers: [longNameMember] });
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

    it('renders correctly with no allMembers (empty team)', () => {
      renderChip({ assignees: [], allMembers: [] });
      expect(screen.getByRole('button', { name: /wash dishes/i })).toBeInTheDocument();
    });
  });
});
