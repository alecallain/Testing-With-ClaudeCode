import { useState } from 'react';
import { format, isToday } from 'date-fns';
import ChoreChip from './ChoreChip';
import type { Chore, Member } from '../../types';

interface ChoreOccurrence {
  chore: Chore;
  date: string;
  done: boolean;
}

interface Props {
  date: Date;
  isCurrentMonth: boolean;
  occurrences: ChoreOccurrence[];
  members: Member[];
  onToggleDone: (choreId: string, date: string) => void;
  onEditChore: (chore: Chore) => void;
}

const MAX_VISIBLE = 3;

export default function DayCell({ date, isCurrentMonth, occurrences, members, onToggleDone, onEditChore }: Props) {
  const [showAll, setShowAll] = useState(false);
  const today = isToday(date);
  const visible = showAll ? occurrences : occurrences.slice(0, MAX_VISIBLE);
  const overflow = occurrences.length - MAX_VISIBLE;

  return (
    <div
      className={`min-h-[100px] border-r border-b border-gray-200 p-1 flex flex-col ${
        isCurrentMonth ? 'bg-white' : 'bg-gray-50'
      }`}
    >
      <div className="flex items-center justify-end mb-1">
        <span
          className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
            today
              ? 'bg-blue-600 text-white'
              : isCurrentMonth
              ? 'text-gray-800'
              : 'text-gray-400'
          }`}
        >
          {format(date, 'd')}
        </span>
      </div>

      <div className="flex flex-col gap-0.5 flex-1">
        {visible.map(({ chore, date: d, done }) => (
          <ChoreChip
            key={chore.id}
            chore={chore}
            date={d}
            done={done}
            assignee={members.find((m) => m.id === chore.assigneeId) ?? null}
            onToggleDone={() => onToggleDone(chore.id, d)}
            onEdit={() => onEditChore(chore)}
          />
        ))}
        {!showAll && overflow > 0 && (
          <button
            onClick={() => setShowAll(true)}
            className="text-[10px] text-blue-500 hover:underline text-left px-1"
          >
            +{overflow} more
          </button>
        )}
        {showAll && occurrences.length > MAX_VISIBLE && (
          <button
            onClick={() => setShowAll(false)}
            className="text-[10px] text-gray-400 hover:underline text-left px-1"
          >
            show less
          </button>
        )}
      </div>
    </div>
  );
}
