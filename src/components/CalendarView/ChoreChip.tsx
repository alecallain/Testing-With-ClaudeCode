import { useState, useRef, useEffect } from 'react';
import type { Chore, Member } from '../../types';
import { getInitials } from '../../utils/colors';

interface Props {
  chore: Chore;
  date: string;
  assignees: Member[];
  allMembers: Member[];
  done: boolean;
  onToggleDone: () => void;
  onEdit: () => void;
  onToggleAssignee: (memberId: string) => void;
}

export default function ChoreChip({ chore, assignees, allMembers, done, onToggleDone, onEdit, onToggleAssignee }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const unassignedMembers = allMembers.filter(
    (m) => !assignees.some((a) => a.id === m.id),
  );

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left flex items-center gap-1 rounded px-1 py-0.5 text-xs text-white truncate"
        style={{ backgroundColor: chore.color }}
        title={chore.title}
      >
        {done && <span className="shrink-0">✓</span>}
        <span className="truncate">{chore.title}</span>
        {assignees.length > 0 && (
          <span className="ml-auto shrink-0 flex">
            {assignees.slice(0, 3).map((m, i) => (
              <span
                key={m.id}
                className="w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
                style={{
                  backgroundColor: m.color,
                  marginLeft: i === 0 ? 0 : -4,
                  zIndex: assignees.length - i,
                  position: 'relative',
                }}
              >
                {getInitials(m.name)}
              </span>
            ))}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-52">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="font-semibold text-sm text-gray-800 leading-tight">{chore.title}</p>
            <button
              onClick={() => { setOpen(false); onEdit(); }}
              className="text-xs text-blue-500 hover:underline shrink-0"
            >
              Edit
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-2">
            {'●'.repeat(chore.difficulty ?? 1)}{'○'.repeat(5 - (chore.difficulty ?? 1))}
            <span className="ml-1 text-gray-400">difficulty</span>
          </p>
          {chore.description && (
            <p className="text-xs text-gray-500 mb-2">{chore.description}</p>
          )}

          {assignees.length > 0 && (
            <div className="mb-2">
              <p className="text-xs text-gray-500 mb-1 font-medium">Assigned to</p>
              {assignees.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-0.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: m.color }}
                    />
                    <span className="text-xs text-gray-700">{m.name}</span>
                  </div>
                  <button
                    onClick={() => onToggleAssignee(m.id)}
                    className="text-xs text-red-400 hover:text-red-600 font-medium leading-none"
                    aria-label={`Remove ${m.name}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {assignees.length < 3 && unassignedMembers.length > 0 && (
            <div className="mb-2">
              <p className="text-xs text-gray-500 mb-1 font-medium">
                {assignees.length === 0 ? 'Assign to' : 'Add assignee'}
              </p>
              {unassignedMembers.map((m) => (
                <button
                  key={m.id}
                  onClick={() => onToggleAssignee(m.id)}
                  className="flex items-center gap-1.5 w-full py-0.5 text-left hover:bg-gray-50 rounded"
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: m.color }}
                  />
                  <span className="text-xs text-gray-600">{m.name}</span>
                  <span className="ml-auto text-xs text-blue-400">+</span>
                </button>
              ))}
            </div>
          )}

          {assignees.length >= 3 && (
            <p className="text-xs text-gray-400 mb-2">Max 3 assignees</p>
          )}

          <button
            onClick={() => { onToggleDone(); setOpen(false); }}
            className={`w-full text-xs rounded px-2 py-1 font-medium ${
              done
                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {done ? 'Mark as not done' : 'Mark as done'}
          </button>
        </div>
      )}
    </div>
  );
}
