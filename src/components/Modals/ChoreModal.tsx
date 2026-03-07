import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { format } from 'date-fns';
import type { Chore, Member, RecurrenceType } from '../../types';
import { CHORE_COLORS } from '../../utils/colors';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
  assigneeId: null,
  color: CHORE_COLORS[0],
  startDate: format(new Date(), 'yyyy-MM-dd'),
  endDate: null,
  recurrence: { type: 'none', daysOfWeek: [], dayOfMonth: null },
});

export default function ChoreModal({ open, onClose, members, initial, onSave, onDelete }: Props) {
  const [form, setForm] = useState<Omit<Chore, 'id'>>(defaultChore());

  useEffect(() => {
    if (open) {
      setForm(initial ? { ...initial } : defaultChore());
    }
  }, [open, initial]);

  function setRecurrenceType(type: RecurrenceType) {
    setForm((f) => ({
      ...f,
      recurrence: { ...f.recurrence, type },
    }));
  }

  function toggleDayOfWeek(day: number) {
    setForm((f) => {
      const days = f.recurrence.daysOfWeek.includes(day)
        ? f.recurrence.daysOfWeek.filter((d) => d !== day)
        : [...f.recurrence.daysOfWeek, day];
      return { ...f, recurrence: { ...f.recurrence, daysOfWeek: days } };
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave(form);
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={2}
                placeholder="Optional details"
              />
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned to</label>
              <select
                value={form.assigneeId ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, assigneeId: e.target.value || null }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
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

            {/* Start / End dates */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Start date *</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">End date</label>
                <input
                  type="date"
                  value={form.endDate ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value || null }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
