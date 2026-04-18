import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import ChoreModal from '../ChoreModal';
import type { Chore, Member } from '../../../types';

// Headless UI v2 works natively in jsdom — no mock needed.
// Content renders into a portal (#headlessui-portal-root).

const alice: Member = { id: 'member-1', name: 'Alice Johnson', color: '#10b981' };
const bob: Member = { id: 'member-2', name: 'Bob Smith', color: '#3b82f6' };

const baseChore: Chore = {
  id: 'chore-1',
  title: 'Clean break room',
  description: 'Wipe counters and empty trash',
  assigneeIds: ['member-1'],
  color: '#3b82f6',
  startDate: '2026-04-15',
  endDate: null,
  recurrence: { type: 'none', daysOfWeek: [], dayOfMonth: null },
  difficulty: 2,
};

function renderModal(overrides: {
  open?: boolean;
  members?: Member[];
  initial?: Chore | null;
  onSave?: ReturnType<typeof vi.fn>;
  onClose?: ReturnType<typeof vi.fn>;
  onDelete?: ReturnType<typeof vi.fn>;
} = {}) {
  const props = {
    open: overrides.open ?? true,
    members: overrides.members ?? [alice, bob],
    initial: overrides.initial !== undefined ? overrides.initial : null,
    onSave: overrides.onSave ?? vi.fn(),
    onClose: overrides.onClose ?? vi.fn(),
    ...(overrides.onDelete !== undefined ? { onDelete: overrides.onDelete } : {}),
  };
  return { ...render(<ChoreModal {...props} />), props };
}

// Helpers to find the date inputs by their sibling label text since labels lack htmlFor
function getStartDateInput() {
  // The start date input is inside a div whose label says "Start date *"
  // Query by display value (defaults to today) — or use type="date" + index
  const dateInputs = document.querySelectorAll('input[type="date"]');
  return dateInputs[0] as HTMLInputElement;
}

function getEndDateInput() {
  const dateInputs = document.querySelectorAll('input[type="date"]');
  return dateInputs[1] as HTMLInputElement;
}

describe('ChoreModal', () => {
  describe('title display', () => {
    it('renders "Add Chore" heading when initial is null', () => {
      renderModal({ initial: null });
      expect(screen.getByRole('heading', { name: 'Add Chore' })).toBeInTheDocument();
    });

    it('renders "Edit Chore" heading when initial chore is provided', () => {
      renderModal({ initial: baseChore });
      expect(screen.getByRole('heading', { name: 'Edit Chore' })).toBeInTheDocument();
    });
  });

  describe('form submission — valid data', () => {
    it('calls onSave and onClose when form has a valid title', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      const onClose = vi.fn();
      renderModal({ initial: null, onSave, onClose });

      await user.type(screen.getByPlaceholderText(/clean break room/i), 'Wash dishes');
      await user.click(screen.getByRole('button', { name: /add chore/i }));

      expect(onSave).toHaveBeenCalledOnce();
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ title: 'Wash dishes' }));
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('does NOT call onSave when title is empty', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      renderModal({ initial: null, onSave });

      // Title input starts empty for a new chore — click submit directly
      await user.click(screen.getByRole('button', { name: /add chore/i }));

      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe('weekly recurrence validation', () => {
    it('shows "Select at least one day." warning when weekly is selected but no days chosen', async () => {
      const user = userEvent.setup();
      renderModal({ initial: null });

      await user.type(screen.getByPlaceholderText(/clean break room/i), 'Test chore');
      await user.click(screen.getByRole('button', { name: /^weekly$/i }));

      expect(screen.getByText('Select at least one day.')).toBeInTheDocument();
    });

    it('blocks submit when weekly recurrence has no days selected', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      renderModal({ initial: null, onSave });

      await user.type(screen.getByPlaceholderText(/clean break room/i), 'Test chore');
      await user.click(screen.getByRole('button', { name: /^weekly$/i }));
      await user.click(screen.getByRole('button', { name: /add chore/i }));

      expect(onSave).not.toHaveBeenCalled();
    });

    it('clears the warning and allows submit when a day is selected', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      const onClose = vi.fn();
      renderModal({ initial: null, onSave, onClose });

      await user.type(screen.getByPlaceholderText(/clean break room/i), 'Test chore');
      await user.click(screen.getByRole('button', { name: /^weekly$/i }));

      // Warning should be present
      expect(screen.getByText('Select at least one day.')).toBeInTheDocument();

      // Select Monday
      await user.click(screen.getByRole('button', { name: 'Mon' }));

      // Warning should disappear
      expect(screen.queryByText('Select at least one day.')).not.toBeInTheDocument();

      // Submit should succeed
      await user.click(screen.getByRole('button', { name: /add chore/i }));
      expect(onSave).toHaveBeenCalledOnce();
    });
  });

  describe('end date validation', () => {
    it('shows "End date must be after start date." when end date is before start date', async () => {
      renderModal({ initial: null });

      fireEvent.change(getStartDateInput(), { target: { value: '2026-04-15' } });
      fireEvent.change(getEndDateInput(), { target: { value: '2026-04-10' } });

      expect(screen.getByText('End date must be after start date.')).toBeInTheDocument();
    });

    it('blocks submit when end date is before start date', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      renderModal({ initial: null, onSave });

      await user.type(screen.getByPlaceholderText(/clean break room/i), 'Test chore');
      fireEvent.change(getStartDateInput(), { target: { value: '2026-04-15' } });
      fireEvent.change(getEndDateInput(), { target: { value: '2026-04-10' } });

      await user.click(screen.getByRole('button', { name: /add chore/i }));

      expect(onSave).not.toHaveBeenCalled();
    });

    it('allows submit when end date is after start date', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      const onClose = vi.fn();
      renderModal({ initial: null, onSave, onClose });

      await user.type(screen.getByPlaceholderText(/clean break room/i), 'Test chore');
      fireEvent.change(getStartDateInput(), { target: { value: '2026-04-10' } });
      fireEvent.change(getEndDateInput(), { target: { value: '2026-04-20' } });

      await user.click(screen.getByRole('button', { name: /add chore/i }));

      expect(onSave).toHaveBeenCalledOnce();
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('hides the end date error when end date is cleared', async () => {
      renderModal({ initial: null });

      fireEvent.change(getStartDateInput(), { target: { value: '2026-04-15' } });
      fireEvent.change(getEndDateInput(), { target: { value: '2026-04-10' } });

      expect(screen.getByText('End date must be after start date.')).toBeInTheDocument();

      // Clear the end date
      fireEvent.change(getEndDateInput(), { target: { value: '' } });

      expect(screen.queryByText('End date must be after start date.')).not.toBeInTheDocument();
    });
  });

  describe('monthly recurrence — dayOfMonth auto-population', () => {
    it('auto-populates dayOfMonth from startDate when switching to monthly', async () => {
      const user = userEvent.setup();
      renderModal({ initial: null });

      // Set start date to the 15th
      fireEvent.change(getStartDateInput(), { target: { value: '2026-04-15' } });

      await user.click(screen.getByRole('button', { name: /^monthly$/i }));

      // The dayOfMonth input (spinbutton) should show 15
      const dayInput = screen.getByRole('spinbutton');
      expect(dayInput).toHaveValue(15);
    });

    it('does not overwrite an existing dayOfMonth when it is already set', async () => {
      const user = userEvent.setup();
      // Start with a chore that has dayOfMonth=20
      const choreWithDayOfMonth: Chore = {
        ...baseChore,
        startDate: '2026-04-15',
        recurrence: { type: 'monthly', daysOfWeek: [], dayOfMonth: 20 },
      };
      renderModal({ initial: choreWithDayOfMonth });

      // Switch to none then back to monthly
      await user.click(screen.getByRole('button', { name: /^none$/i }));
      await user.click(screen.getByRole('button', { name: /^monthly$/i }));

      // dayOfMonth was 20; switching back should preserve it (it was non-null)
      const dayInput = screen.getByRole('spinbutton');
      expect(dayInput).toHaveValue(20);
    });
  });

  describe('assignee toggling', () => {
    it('selecting an unselected member pill adds them to assigneeIds on save', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      const onClose = vi.fn();
      // Start with no assignees
      renderModal({ initial: null, members: [alice, bob], onSave, onClose });

      await user.type(screen.getByPlaceholderText(/clean break room/i), 'Test chore');
      await user.click(screen.getByRole('button', { name: /alice johnson/i }));

      await user.click(screen.getByRole('button', { name: /add chore/i }));

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ assigneeIds: expect.arrayContaining(['member-1']) })
      );
    });

    it('clicking a selected member pill deselects them from assigneeIds on save', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      const onClose = vi.fn();
      const choreWithAlice: Chore = { ...baseChore, assigneeIds: ['member-1'] };
      renderModal({ initial: choreWithAlice, members: [alice, bob], onSave, onClose });

      // Alice is currently selected — click to deselect
      await user.click(screen.getByRole('button', { name: /alice johnson/i }));

      await user.click(screen.getByRole('button', { name: /save/i }));

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ assigneeIds: [] })
      );
    });
  });

  describe('delete button', () => {
    it('shows Delete button when initial chore and onDelete are both provided', () => {
      renderModal({ initial: baseChore, onDelete: vi.fn() });
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });

    it('does not show Delete button when onDelete is not provided', () => {
      renderModal({ initial: baseChore });
      expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    });

    it('does not show Delete button when initial is null (even if onDelete is provided)', () => {
      renderModal({ initial: null, onDelete: vi.fn() });
      expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    });

    it('calls both onDelete and onClose when Delete is clicked', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      const onClose = vi.fn();
      renderModal({ initial: baseChore, onDelete, onClose });

      await user.click(screen.getByRole('button', { name: /delete/i }));

      expect(onDelete).toHaveBeenCalledOnce();
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  describe('form reset on reopen', () => {
    it('populates the title input from initial when the modal opens', () => {
      // When initial is provided, the form should show its title on open
      renderModal({ initial: baseChore });
      expect(screen.getByDisplayValue('Clean break room')).toBeInTheDocument();
    });

    it('title input is empty when the modal opens with no initial', () => {
      renderModal({ initial: null });
      expect(screen.getByPlaceholderText(/clean break room/i)).toHaveValue('');
    });

    it('re-populates with updated initial when open transitions false → true', () => {
      // Render closed first so the useEffect fires on the first open
      const onSave = vi.fn();
      const onClose = vi.fn();
      const { rerender } = render(
        <ChoreModal
          open={false}
          members={[alice, bob]}
          initial={null}
          onSave={onSave}
          onClose={onClose}
        />
      );

      const newChore: Chore = { ...baseChore, id: 'chore-2', title: 'New chore title' };

      rerender(
        <ChoreModal
          open={true}
          members={[alice, bob]}
          initial={newChore}
          onSave={onSave}
          onClose={onClose}
        />
      );

      expect(screen.getByDisplayValue('New chore title')).toBeInTheDocument();
    });

    it('title input is empty when modal opens from closed state with no initial', () => {
      const onSave = vi.fn();
      const onClose = vi.fn();
      const { rerender } = render(
        <ChoreModal
          open={false}
          members={[alice, bob]}
          initial={null}
          onSave={onSave}
          onClose={onClose}
        />
      );

      rerender(
        <ChoreModal
          open={true}
          members={[alice, bob]}
          initial={null}
          onSave={onSave}
          onClose={onClose}
        />
      );

      expect(screen.getByPlaceholderText(/clean break room/i)).toHaveValue('');
    });
  });
});
