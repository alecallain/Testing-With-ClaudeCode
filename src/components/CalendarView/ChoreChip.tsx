import { useState, useRef, useEffect } from 'react';
import type { Chore, Member } from '../../types';
import { getInitials } from '../../utils/colors';

interface Props {
  chore: Chore;
  date: string;
  assignee: Member | null;
  done: boolean;
  onToggleDone: () => void;
  onEdit: () => void;
}

export default function ChoreChip({ chore, assignee, done, onToggleDone, onEdit }: Props) {
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
        {assignee && (
          <span
            className="ml-auto shrink-0 w-4 h-4 rounded-full bg-white/30 text-[9px] font-bold flex items-center justify-center"
          >
            {getInitials(assignee.name)}
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
          {chore.description && (
            <p className="text-xs text-gray-500 mb-2">{chore.description}</p>
          )}
          {assignee && (
            <p className="text-xs text-gray-600 mb-2">
              Assigned to: <span className="font-medium">{assignee.name}</span>
            </p>
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
