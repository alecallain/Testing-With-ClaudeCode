import { useState, useCallback } from 'react';
import type { Member, Chore, Completion, StoreState } from '../types';

const STORAGE_KEY = 'office-chores';

function loadState(): StoreState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as StoreState;
  } catch {
    // ignore parse errors
  }
  return { members: [], chores: [], completions: [] };
}

function saveState(state: StoreState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useStore() {
  const [state, setState] = useState<StoreState>(loadState);

  const update = useCallback((updater: (prev: StoreState) => StoreState) => {
    setState((prev) => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  }, []);

  // --- Members ---

  const addMember = useCallback(
    (member: Omit<Member, 'id'>) => {
      update((prev) => ({
        ...prev,
        members: [...prev.members, { ...member, id: crypto.randomUUID() }],
      }));
    },
    [update],
  );

  const removeMember = useCallback(
    (id: string) => {
      update((prev) => ({
        ...prev,
        members: prev.members.filter((m) => m.id !== id),
        // Unassign chores that belonged to this member
        chores: prev.chores.map((c) =>
          c.assigneeId === id ? { ...c, assigneeId: null } : c,
        ),
      }));
    },
    [update],
  );

  // --- Chores ---

  const addChore = useCallback(
    (chore: Omit<Chore, 'id'>) => {
      update((prev) => ({
        ...prev,
        chores: [...prev.chores, { ...chore, id: crypto.randomUUID() }],
      }));
    },
    [update],
  );

  const updateChore = useCallback(
    (chore: Chore) => {
      update((prev) => ({
        ...prev,
        chores: prev.chores.map((c) => (c.id === chore.id ? chore : c)),
      }));
    },
    [update],
  );

  const removeChore = useCallback(
    (id: string) => {
      update((prev) => ({
        ...prev,
        chores: prev.chores.filter((c) => c.id !== id),
        completions: prev.completions.filter((c) => c.choreId !== id),
      }));
    },
    [update],
  );

  // --- Completions ---

  const toggleCompletion = useCallback(
    (choreId: string, date: string) => {
      update((prev) => {
        const existing = prev.completions.find(
          (c) => c.choreId === choreId && c.date === date,
        );
        if (existing) {
          return {
            ...prev,
            completions: prev.completions.filter((c) => c.id !== existing.id),
          };
        }
        const newCompletion: Completion = {
          id: crypto.randomUUID(),
          choreId,
          date,
          completedAt: new Date().toISOString(),
        };
        return { ...prev, completions: [...prev.completions, newCompletion] };
      });
    },
    [update],
  );

  const isCompleted = useCallback(
    (choreId: string, date: string) =>
      state.completions.some((c) => c.choreId === choreId && c.date === date),
    [state.completions],
  );

  return {
    members: state.members,
    chores: state.chores,
    completions: state.completions,
    addMember,
    removeMember,
    addChore,
    updateChore,
    removeChore,
    toggleCompletion,
    isCompleted,
  };
}

export type Store = ReturnType<typeof useStore>;
