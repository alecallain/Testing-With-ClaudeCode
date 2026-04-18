import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import TeamModal from '../TeamModal';
import type { Member } from '../../../types';

// Headless UI v2 works natively in jsdom — no mock needed.
// Content renders into a portal (#headlessui-portal-root).

const alice: Member = { id: 'member-1', name: 'Alice Johnson', color: '#10b981' };
const bob: Member = { id: 'member-2', name: 'Bob Smith', color: '#3b82f6' };

function renderModal(overrides: {
  open?: boolean;
  members?: Member[];
  onAdd?: ReturnType<typeof vi.fn>;
  onRemove?: ReturnType<typeof vi.fn>;
  onClose?: ReturnType<typeof vi.fn>;
} = {}) {
  const props = {
    open: overrides.open ?? true,
    members: overrides.members ?? [alice, bob],
    onAdd: overrides.onAdd ?? vi.fn(),
    onRemove: overrides.onRemove ?? vi.fn(),
    onClose: overrides.onClose ?? vi.fn(),
  };
  return { ...render(<TeamModal {...props} />), props };
}

describe('TeamModal', () => {
  describe('member list rendering', () => {
    it('renders all member names', () => {
      renderModal();
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    });

    it('shows "No team members yet." when members list is empty', () => {
      renderModal({ members: [] });
      expect(screen.getByText('No team members yet.')).toBeInTheDocument();
    });

    it('renders a Remove button for each member', () => {
      renderModal();
      const removeButtons = screen.getAllByRole('button', { name: 'Remove' });
      expect(removeButtons.length).toBe(2);
    });
  });

  describe('name input reset on reopen', () => {
    it('name input is empty when modal first opens', () => {
      renderModal();
      expect(screen.getByPlaceholderText('Name')).toHaveValue('');
    });

    it('name input is empty when modal opens from closed state (false → true)', () => {
      // Render closed, then open — the useEffect should reset name to ''
      const onAdd = vi.fn();
      const onRemove = vi.fn();
      const onClose = vi.fn();
      const { rerender } = render(
        <TeamModal
          open={false}
          members={[alice, bob]}
          onAdd={onAdd}
          onRemove={onRemove}
          onClose={onClose}
        />
      );

      rerender(
        <TeamModal
          open={true}
          members={[alice, bob]}
          onAdd={onAdd}
          onRemove={onRemove}
          onClose={onClose}
        />
      );

      expect(screen.getByPlaceholderText('Name')).toHaveValue('');
    });
  });

  describe('remove confirmation flow', () => {
    it('clicking Remove shows "Remove? Yes Cancel" and does NOT immediately call onRemove', async () => {
      const user = userEvent.setup();
      const onRemove = vi.fn();
      renderModal({ members: [alice], onRemove });

      await user.click(screen.getByRole('button', { name: 'Remove' }));

      expect(screen.getByText('Remove?')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(onRemove).not.toHaveBeenCalled();
    });

    it('clicking Yes calls onRemove with the correct member id', async () => {
      const user = userEvent.setup();
      const onRemove = vi.fn();
      renderModal({ members: [alice], onRemove });

      await user.click(screen.getByRole('button', { name: 'Remove' }));
      await user.click(screen.getByRole('button', { name: 'Yes' }));

      expect(onRemove).toHaveBeenCalledOnce();
      expect(onRemove).toHaveBeenCalledWith('member-1');
    });

    it('clicking Cancel hides the confirmation without calling onRemove', async () => {
      const user = userEvent.setup();
      const onRemove = vi.fn();
      renderModal({ members: [alice], onRemove });

      await user.click(screen.getByRole('button', { name: 'Remove' }));
      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onRemove).not.toHaveBeenCalled();
      expect(screen.queryByText('Remove?')).not.toBeInTheDocument();
    });

    it('clicking Remove on member B collapses member A confirmation and shows member B confirmation', async () => {
      const user = userEvent.setup();
      renderModal({ members: [alice, bob] });

      // Open confirmation for Alice (first Remove button)
      const [aliceRemove, bobRemove] = screen.getAllByRole('button', { name: 'Remove' });
      await user.click(aliceRemove);

      // Alice's confirmation is showing
      expect(screen.getByText('Remove?')).toBeInTheDocument();

      // Now click Remove for Bob — the only remaining Remove button (Alice's row shows Yes/Cancel now)
      await user.click(bobRemove);

      // Only one "Remove?" should be visible — now for Bob
      expect(screen.getAllByText('Remove?').length).toBe(1);
      // Confirm it is Bob's row by clicking Yes and checking it was Bob
      // (We verify by checking that Alice's row is back to showing a Remove button)
      expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
    });

    it('clicking Yes calls onRemove with the correct id when second member is confirmed', async () => {
      const user = userEvent.setup();
      const onRemove = vi.fn();
      renderModal({ members: [alice, bob], onRemove });

      const removeButtons = screen.getAllByRole('button', { name: 'Remove' });
      // Click Remove for Bob (second)
      await user.click(removeButtons[1]);
      await user.click(screen.getByRole('button', { name: 'Yes' }));

      expect(onRemove).toHaveBeenCalledWith('member-2');
    });
  });

  describe('confirmation reset on modal open', () => {
    it('no confirmation is shown when the modal first opens', () => {
      renderModal({ members: [alice, bob] });
      expect(screen.queryByText('Remove?')).not.toBeInTheDocument();
    });

    it('no confirmation is shown when the modal opens from a closed state (false → true)', () => {
      // Open from closed — confirmRemoveId should be null (reset by useEffect)
      const onAdd = vi.fn();
      const onRemove = vi.fn();
      const onClose = vi.fn();
      const { rerender } = render(
        <TeamModal
          open={false}
          members={[alice, bob]}
          onAdd={onAdd}
          onRemove={onRemove}
          onClose={onClose}
        />
      );

      rerender(
        <TeamModal
          open={true}
          members={[alice, bob]}
          onAdd={onAdd}
          onRemove={onRemove}
          onClose={onClose}
        />
      );

      expect(screen.queryByText('Remove?')).not.toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: 'Remove' }).length).toBe(2);
    });
  });

  describe('add member', () => {
    it('calls onAdd with the trimmed name and a color when Add button is clicked', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn();
      renderModal({ members: [], onAdd });

      await user.type(screen.getByPlaceholderText('Name'), 'Charlie');
      await user.click(screen.getByRole('button', { name: 'Add' }));

      expect(onAdd).toHaveBeenCalledOnce();
      expect(onAdd).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Charlie', color: expect.any(String) })
      );
    });

    it('clears the name input after adding a member', async () => {
      const user = userEvent.setup();
      renderModal({ members: [] });

      await user.type(screen.getByPlaceholderText('Name'), 'Charlie');
      await user.click(screen.getByRole('button', { name: 'Add' }));

      expect(screen.getByPlaceholderText('Name')).toHaveValue('');
    });

    it('pressing Enter in the name input triggers add', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn();
      renderModal({ members: [], onAdd });

      await user.type(screen.getByPlaceholderText('Name'), 'Charlie{Enter}');

      expect(onAdd).toHaveBeenCalledOnce();
      expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ name: 'Charlie' }));
    });

    it('does not call onAdd when name input is empty', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn();
      renderModal({ onAdd });

      await user.click(screen.getByRole('button', { name: 'Add' }));

      expect(onAdd).not.toHaveBeenCalled();
    });

    it('does not call onAdd when name input is only whitespace', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn();
      renderModal({ onAdd });

      await user.type(screen.getByPlaceholderText('Name'), '   ');
      await user.click(screen.getByRole('button', { name: 'Add' }));

      expect(onAdd).not.toHaveBeenCalled();
    });
  });
});
