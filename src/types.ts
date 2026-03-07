export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Recurrence {
  type: RecurrenceType;
  daysOfWeek: number[]; // 0=Sun ... 6=Sat, used when type='weekly'
  dayOfMonth: number | null; // 1-31, used when type='monthly'
}

export interface Member {
  id: string;
  name: string;
  color: string; // tailwind bg color class e.g. 'bg-blue-500'
}

export interface Chore {
  id: string;
  title: string;
  description: string;
  assigneeId: string | null;
  color: string; // hex color for the chore chip
  startDate: string; // YYYY-MM-DD
  endDate: string | null; // YYYY-MM-DD or null
  recurrence: Recurrence;
}

export interface Completion {
  id: string;
  choreId: string;
  date: string; // YYYY-MM-DD of the occurrence
  completedAt: string; // ISO timestamp
}

export interface StoreState {
  members: Member[];
  chores: Chore[];
  completions: Completion[];
}
