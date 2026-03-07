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
  parseISO,
  isAfter,
  isBefore,
} from 'date-fns';
import DayCell from './DayCell';
import type { Chore, Member } from '../../types';
import { getOccurrencesInRange } from '../../utils/recurrence';
import { getInitials } from '../../utils/colors';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Pixel constants that must match DayCell's layout:
// DayCell has p-1 (4px) top padding + h-6 (24px) date number + mb-1 (4px) margin = 32px
const DATE_HEADER_HEIGHT = 32;
const SPAN_BAR_HEIGHT = 22;
const SPAN_BAR_GAP = 2;
const SPAN_ROW_SIZE = SPAN_BAR_HEIGHT + SPAN_BAR_GAP;

interface SpanSegment {
  chore: Chore;
  startCol: number; // 0–6
  colSpan: number;  // 1–7
  rowIndex: number; // for vertical stacking
  isStart: boolean; // chore begins in this week
  isEnd: boolean;   // chore ends in this week
}

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

  // Group days into weeks
  const weeks = useMemo(() => {
    const result: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) result.push(days.slice(i, i + 7));
    return result;
  }, [days]);

  // Chores with recurrence='none' and an endDate render as spanning bars
  const spanningChores = useMemo(
    () => chores.filter((c) => c.recurrence.type === 'none' && c.endDate != null),
    [chores],
  );
  const nonSpanningChores = useMemo(
    () => chores.filter((c) => c.recurrence.type !== 'none' || c.endDate == null),
    [chores],
  );

  // Compute spanning bar segments per week
  const weekSpans = useMemo<SpanSegment[][]>(() => {
    return weeks.map((week) => {
      const weekStart = week[0];
      const weekEnd = week[6];
      const segments: SpanSegment[] = [];

      for (const chore of spanningChores) {
        const choreStart = parseISO(chore.startDate);
        const choreEnd = parseISO(chore.endDate!);

        if (isAfter(choreStart, weekEnd) || isBefore(choreEnd, weekStart)) continue;

        const segStart = isAfter(choreStart, weekStart) ? choreStart : weekStart;
        const segEnd = isBefore(choreEnd, weekEnd) ? choreEnd : weekEnd;

        segments.push({
          chore,
          startCol: segStart.getDay(),
          colSpan: segEnd.getDay() - segStart.getDay() + 1,
          rowIndex: segments.length,
          isStart: !isBefore(choreStart, weekStart),
          isEnd: !isAfter(choreEnd, weekEnd),
        });
      }

      return segments;
    });
  }, [weeks, spanningChores]);

  // How many span rows each day needs to reserve (for DayCell padding)
  const spanRowsPerDay = useMemo(() => {
    const map: Record<string, number> = {};
    weeks.forEach((week, wi) => {
      const segs = weekSpans[wi];
      week.forEach((day, col) => {
        const overlapping = segs.filter((s) => col >= s.startCol && col < s.startCol + s.colSpan);
        map[format(day, 'yyyy-MM-dd')] =
          overlapping.length > 0 ? Math.max(...overlapping.map((s) => s.rowIndex)) + 1 : 0;
      });
    });
    return map;
  }, [weeks, weekSpans]);

  // Occurrence map for non-spanning chores only
  const occurrenceMap = useMemo(() => {
    const map: Record<string, { chore: Chore; date: string; done: boolean }[]> = {};
    const rangeStart = days[0];
    const rangeEnd = days[days.length - 1];
    for (const chore of nonSpanningChores) {
      const dates = getOccurrencesInRange(chore, rangeStart, rangeEnd);
      for (const date of dates) {
        if (!map[date]) map[date] = [];
        map[date].push({ chore, date, done: isCompleted(chore.id, date) });
      }
    }
    return map;
  }, [nonSpanningChores, days, isCompleted]);

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

      {/* Calendar grid — one row per week */}
      <div className="flex flex-col flex-1 border-t border-l border-gray-200 overflow-auto">
        {weeks.map((week, wi) => {
          const segs = weekSpans[wi];
          return (
            <div key={wi} className="relative grid grid-cols-7 flex-1" style={{ minHeight: 100 }}>
              {/* Day cells */}
              {week.map((day) => {
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
                    spanRowCount={spanRowsPerDay[dateStr] ?? 0}
                  />
                );
              })}

              {/* Spanning event bars — absolutely positioned across week columns */}
              {segs.map((seg) => {
                const assignee = members.find((m) => m.id === seg.chore.assigneeId) ?? null;
                const leftPct = (seg.startCol / 7) * 100;
                const widthPct = (seg.colSpan / 7) * 100;
                const top = DATE_HEADER_HEIGHT + seg.rowIndex * SPAN_ROW_SIZE;
                const radius = 4;
                return (
                  <button
                    key={seg.chore.id}
                    onClick={() => onEditChore(seg.chore)}
                    title={seg.chore.title}
                    className="absolute flex items-center gap-1 text-xs text-white overflow-hidden z-10"
                    style={{
                      left: `calc(${leftPct}% + ${seg.isStart ? 3 : 0}px)`,
                      width: `calc(${widthPct}% - ${(seg.isStart ? 3 : 0) + (seg.isEnd ? 3 : 0) + 1}px)`,
                      top,
                      height: SPAN_BAR_HEIGHT,
                      backgroundColor: seg.chore.color,
                      borderRadius: `${seg.isStart ? radius : 0}px ${seg.isEnd ? radius : 0}px ${seg.isEnd ? radius : 0}px ${seg.isStart ? radius : 0}px`,
                      paddingLeft: seg.isStart ? 6 : 4,
                      paddingRight: 4,
                    }}
                  >
                    {seg.isStart && <span className="truncate">{seg.chore.title}</span>}
                    {seg.isEnd && assignee && (
                      <span className="ml-auto shrink-0 w-4 h-4 rounded-full bg-white/30 text-[9px] font-bold flex items-center justify-center">
                        {getInitials(assignee.name)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
