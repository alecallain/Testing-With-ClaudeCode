import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import type { Member } from '../../types';
import { MEMBER_COLORS, getInitials } from '../../utils/colors';
import ModalShell from './ModalShell';

interface Props {
  open: boolean;
  onClose: () => void;
  members: Member[];
  onAdd: (member: Omit<Member, 'id'>) => void;
  onRemove: (id: string) => void;
}

export default function TeamModal({ open, onClose, members, onAdd, onRemove }: Props) {
  const [name, setName] = useState('');
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName('');
      setConfirmRemoveId(null);
    }
  }, [open]);

  function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const usedColors = members.map((m) => m.color);
    const color = MEMBER_COLORS.find((c) => !usedColors.includes(c)) ?? MEMBER_COLORS[members.length % MEMBER_COLORS.length];
    onAdd({ name: trimmed, color });
    setName('');
  }

  return (
    <ModalShell open={open} onClose={onClose} maxWidth="max-w-sm">
      <Dialog.Title className="text-lg font-semibold text-gray-800 mb-4">
        Manage Team
      </Dialog.Title>

      {/* Member list */}
      <div className="flex flex-col gap-2 mb-4 max-h-60 overflow-y-auto">
        {members.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">No team members yet.</p>
        )}
        {members.map((m) => (
          <div key={m.id} className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ backgroundColor: m.color }}
            >
              {getInitials(m.name)}
            </div>
            <span className="flex-1 text-sm text-gray-800">{m.name}</span>
            {confirmRemoveId === m.id ? (
              <>
                <span className="text-xs text-red-600">Remove?</span>
                <button
                  type="button"
                  onClick={() => { onRemove(m.id); setConfirmRemoveId(null); }}
                  className="text-xs text-red-600 font-semibold hover:text-red-800 px-1"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmRemoveId(null)}
                  className="text-xs text-gray-500 hover:text-gray-700 px-1"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmRemoveId(m.id)}
                className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add member */}
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Name"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          Add
        </button>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm rounded-lg text-gray-600 hover:bg-gray-100 border border-gray-200"
        >
          Done
        </button>
      </div>
    </ModalShell>
  );
}
