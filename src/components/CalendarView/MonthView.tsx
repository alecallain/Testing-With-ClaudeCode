import { useState, useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  format,
  isSameMonth,
} from 'date-fns';
import DayCell from './DayCell';
import type { Chore, Member } from '../../types';
import { getOccurrencesInRange } from '../../utils/recurrence';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface Props {
  chores: Chore[];
  members: Member[];
  isCompleted: (choreId: string, date: string) => boolean;
  onToggleDone: (choreId: string, date: string) => void;
  onEditChore: (chore: Chore) => void;
}

export default function MonthView({ chores, members, isCompleted, onToggleDone, onEditChore }: Props) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    const result: Date[] = [];
    let cursor = start;
    while (cursor <= end) {
      result.push(cursor);
      cursor = addDays(cursor, 1);
    }
    return result;
  }, [currentMonth]);

  // Pre-compute occurrence map: dateStr -> ChoreOccurrence[]
  const occurrenceMap = useMemo(() => {
    const map: Record<string, { chore: Chore; date: string; done: boolean }[]> = {};
    const rangeStart = days[0];
    const rangeEnd = days[days.length - 1];

    for (const chore of chores) {
      const dates = getOccurrencesInRange(chore, rangeStart, rangeEnd);
      for (const date of dates) {
        if (!map[date]) map[date] = [];
        map[date].push({ chore, date, done: isCompleted(chore.id, date) });
      }
    }
    return map;
  }, [chores, days, isCompleted]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <button
          onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
          aria-label="Previous month"
        >
          ‹
        </button>
        <h2 className="text-lg font-semibold text-gray-800">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button
          onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      {/* Day-of-week labels */}
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 flex-1 border-t border-l border-gray-200 overflow-auto">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          return (
            <DayCell
              key={dateStr}
              date={day}
              isCurrentMonth={isSameMonth(day, currentMonth)}
              occurrences={occurrenceMap[dateStr] ?? []}
              members={members}
              onToggleDone={onToggleDone}
              onEditChore={onEditChore}
            />
          );
        })}
      </div>
    </div>
  );
}
