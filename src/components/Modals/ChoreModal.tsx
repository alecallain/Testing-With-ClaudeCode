import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { format, parseISO, getDate } from 'date-fns';
import type { Chore, Member, RecurrenceType } from '../../types';
import { CHORE_COLORS } from '../../utils/colors';
import ModalShell from './ModalShell';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const INPUT_CLS =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

interface Props {
  open: boolean;
  onClose: () => void;
  members: Member[];
  initial?: Chore | null;
  onSave: (chore: Omit<Chore, 'id'>) => void;
  onDelete?: () => void;
}

const defaultChore = (): Omit<Chore, 'id'> => ({
  title: '',
  description: '',
  assigneeIds: [],
  color: CHORE_COLORS[0],
  startDate: format(new Date(), 'yyyy-MM-dd'),
  endDate: null,
  recurrence: { type: 'none', daysOfWeek: [], dayOfMonth: null },
  difficulty: 1,
});

export default function ChoreModal({ open, onClose, members, initial, onSave, onDelete }: Props) {
  const [form, setForm] = useState<Omit<Chore, 'id'>>(defaultChore());

  useEffect(() => {
    if (open) {
      setForm(initial ? { ...initial } : defaultChore());
    }
  }, [open, initial]);

  function setRecurrenceType(type: RecurrenceType) {
    setForm((f) => {
      const dayOfMonth =
        type === 'monthly' && f.recurrence.dayOfMonth === null
          ? getDate(parseISO(f.startDate))
          : f.recurrence.dayOfMonth;
      return { ...f, recurrence: { ...f.recurrence, type, dayOfMonth } };
    });
  }

  function toggleDayOfWeek(day: number) {
    setForm((f) => {
      const days = f.recurrence.daysOfWeek.includes(day)
        ? f.recurrence.daysOfWeek.filter((d) => d !== day)
        : [...f.recurrence.daysOfWeek, day];
      return { ...f, recurrence: { ...f.recurrence, daysOfWeek: days } };
    });
  }

  function toggleAssignee(memberId: string) {
    setForm((f) => {
      const ids = f.assigneeIds.includes(memberId)
        ? f.assigneeIds.filter((id) => id !== memberId)
        : [...f.assigneeIds, memberId];
      return { ...f, assigneeIds: ids };
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (form.recurrence.type === 'weekly' && form.recurrence.daysOfWeek.length === 0) return;
    if (form.endDate && form.endDate < form.startDate) return;
    onSave(form);
    onClose();
  }

  return (
    <ModalShell open={open} onClose={onClose} maxWidth="max-w-md">
          <Dialog.Title className="text-lg font-semibold text-gray-800 mb-4">
            {initial ? 'Edit Chore' : 'Add Chore'}
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className={INPUT_CLS}
                placeholder="e.g. Clean break room"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className={`${INPUT_CLS} resize-none`}
                rows={2}
                placeholder="Optional details"
              />
            </div>

            {/* Assignees */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign to <span className="text-gray-400 font-normal">(up to 4)</span>
              </label>
              {members.length === 0 ? (
                <p className="text-xs text-gray-400">No team members yet — add some via "Manage Team".</p>
              ) : (
                <div className="flex gap-2 flex-wrap">
                  {members.map((m) => {
                    const isSelected = form.assigneeIds.includes(m.id);
                    const atMax = form.assigneeIds.length >= 4;
                    const disabled = !isSelected && atMax;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => toggleAssignee(m.id)}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs border transition-colors ${
                          isSelected
                            ? 'border-transparent text-white'
                            : disabled
                            ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                        style={isSelected ? { backgroundColor: m.color, borderColor: m.color } : undefined}
                      >
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.5)' : m.color }}
                        />
                        {m.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <div className="flex gap-2 flex-wrap">
                {CHORE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, color: c }))}
                    className={`w-7 h-7 rounded-full border-2 ${form.color === c ? 'border-gray-800' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, difficulty: d }))}
                    className={`flex-1 text-xs rounded-lg px-2 py-1.5 border ${
                      form.difficulty === d
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">1 = easiest · 5 = hardest</p>
            </div>

            {/* Start / End dates */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Start date *</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  className={INPUT_CLS}
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">End date</label>
                <input
                  type="date"
                  value={form.endDate ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value || null }))}
                  className={INPUT_CLS}
                />
                {form.endDate && form.endDate < form.startDate && (
                  <p className="text-xs text-red-500 mt-1">End date must be after start date.</p>
                )}
              </div>
            </div>

            {/* Recurrence */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recurrence</label>
              <div className="flex gap-2">
                {(['none', 'daily', 'weekly', 'monthly'] as RecurrenceType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setRecurrenceType(t)}
                    className={`flex-1 text-xs rounded-lg px-2 py-1.5 border capitalize ${
                      form.recurrence.type === t
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {form.recurrence.type === 'weekly' && (
                <div className="mt-2 flex gap-1 flex-wrap">
                  {DAY_NAMES.map((name, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleDayOfWeek(i)}
                      className={`text-xs rounded-full w-9 h-9 border ${
                        form.recurrence.daysOfWeek.includes(i)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                  {form.recurrence.daysOfWeek.length === 0 && (
                    <p className="w-full text-xs text-red-500 mt-1">Select at least one day.</p>
                  )}
                </div>
              )}

              {form.recurrence.type === 'monthly' && (
                <div className="mt-2">
                  <label className="text-xs text-gray-600 mb-1 block">Day of month (1–31)</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={form.recurrence.dayOfMonth ?? ''}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        recurrence: {
                          ...f.recurrence,
                          dayOfMonth: e.target.value ? parseInt(e.target.value) : null,
                        },
                      }))
                    }
                    className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 1"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              {initial && onDelete && (
                <button
                  type="button"
                  onClick={() => { onDelete(); onClose(); }}
                  className="px-4 py-2 text-sm rounded-lg text-red-600 hover:bg-red-50 border border-red-200"
                >
                  Delete
                </button>
              )}
              <div className="ml-auto flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm rounded-lg text-gray-600 hover:bg-gray-100 border border-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  {initial ? 'Save' : 'Add Chore'}
                </button>
              </div>
            </div>
          </form>
    </ModalShell>
  );
}
