export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Recurrence {
  type: RecurrenceType;
  daysOfWeek: number[]; // 0=Sun ... 6=Sat, used when type='weekly'
  dayOfMonth: number | null; // 1-31, used when type='monthly'
}

export interface Member {
  id: string;
  name: string;
  color: string; // hex color string e.g. '#3b82f6'
}

export interface Chore {
  id: string;
  title: string;
  description: string;
  assigneeIds: string[]; // up to 3 member IDs
  color: string; // hex color for the chore chip
  startDate: string; // YYYY-MM-DD
  endDate: string | null; // YYYY-MM-DD or null
  recurrence: Recurrence;
  difficulty: number; // 1 (easiest) – 5 (hardest)
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
