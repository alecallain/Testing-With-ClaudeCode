import { useMemo } from 'react';
import { startOfMonth, endOfMonth } from 'date-fns';
import type { Chore } from '../../types';
import { getOccurrencesInRange } from '../../utils/recurrence';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April',
  'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December',
];

interface Props {
  chores: Chore[];
  currentYear: number;
  onNavigateYear: (direction: 'prev' | 'next') => void;
  onSelectMonth: (date: Date) => void;
  onSwitchToMonth: () => void;
}

export default function YearView({ chores, currentYear, onNavigateYear, onSelectMonth, onSwitchToMonth }: Props) {
  const monthlyCounts = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const monthStart = startOfMonth(new Date(currentYear, i, 1));
      const monthEnd = endOfMonth(monthStart);
      let count = 0;
      for (const chore of chores) {
        count += getOccurrencesInRange(chore, monthStart, monthEnd).length;
      }
      return count;
    });
  }, [chores, currentYear]);

  const maxCount = Math.max(...monthlyCounts, 1);
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onNavigateYear('prev')}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
            aria-label="Previous year"
          >
            ‹
          </button>
          <h2 className="text-lg font-semibold text-gray-800 min-w-[80px] text-center">
            {currentYear}
          </h2>
          <button
            onClick={() => onNavigateYear('next')}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
            aria-label="Next year"
          >
            ›
          </button>
        </div>
        <div className="flex rounded-md border border-gray-200 overflow-hidden text-sm">
          <button onClick={onSwitchToMonth} className="px-3 py-1 text-gray-600 hover:bg-gray-50">Month</button>
          <button className="px-3 py-1 bg-gray-800 text-white font-medium">Year</button>
        </div>
      </div>

      {/* Month grid — 3 rows × 4 columns */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-4 gap-4 h-full" style={{ gridTemplateRows: 'repeat(3, 1fr)' }}>
          {MONTH_NAMES.map((name, i) => {
            const isCurrentMonth = currentYear === todayYear && i === todayMonth;
            const count = monthlyCounts[i];
            const barHeightPct = Math.round((count / maxCount) * 60);

            return (
              <button
                key={name}
                onClick={() => onSelectMonth(new Date(currentYear, i, 1))}
                className={`
                  flex flex-col items-center justify-between p-4 rounded-xl border text-left
                  hover:border-gray-400 hover:shadow-sm transition-all
                  ${isCurrentMonth ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white'}
                `}
                aria-label={`${name} ${currentYear}: ${count} occurrence${count !== 1 ? 's' : ''}`}
              >
                <span className={`text-sm font-medium ${isCurrentMonth ? 'text-blue-700' : 'text-gray-700'}`}>
                  {name}
                </span>

                {/* Mini bar chart */}
                <div className="w-full flex items-end justify-center my-2" style={{ height: 48 }}>
                  <div
                    className={`w-8 rounded-sm transition-all ${isCurrentMonth ? 'bg-blue-400' : 'bg-gray-300'}`}
                    style={{ height: count === 0 ? 3 : `${barHeightPct}%` }}
                  />
                </div>

                <span className={`text-2xl font-bold ${isCurrentMonth ? 'text-blue-700' : 'text-gray-800'}`}>
                  {count}
                </span>
                <span className="text-xs text-gray-400 mt-0.5">
                  {count === 1 ? 'occurrence' : 'occurrences'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
