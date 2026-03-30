import { useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Member, Chore, Completion, StoreState } from '../types';

const STATE_KEY = ['state'] as const;
const EMPTY_STATE: StoreState = { members: [], chores: [], completions: [] };

async function fetchState(): Promise<StoreState> {
  const res = await fetch('/api/state');
  return res.json() as Promise<StoreState>;
}

function post(path: string, body: unknown): Promise<Response> {
  return fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function useStore() {
  const queryClient = useQueryClient();

  // --- Initial state load ---

  const { data, isLoading } = useQuery({
    queryKey: STATE_KEY,
    queryFn: fetchState,
    staleTime: Infinity, // SSE owns freshness
    refetchOnWindowFocus: false,
  });

  const state: StoreState = data ?? EMPTY_STATE;

  // --- SSE subscription for real-time updates ---

  useEffect(() => {
    const es = new EventSource('/api/events');

    const patch = (updater: (prev: StoreState) => StoreState) => {
      queryClient.setQueryData<StoreState>(STATE_KEY, (prev) =>
        prev ? updater(prev) : prev,
      );
    };

    es.addEventListener('member:add', (e) => {
      const member = JSON.parse(e.data) as Member;
      patch((prev) => ({ ...prev, members: [...prev.members, member] }));
    });

    es.addEventListener('member:remove', (e) => {
      const { id, updatedChores } = JSON.parse(e.data) as {
        id: string;
        updatedChores: Chore[];
      };
      patch((prev) => ({
        ...prev,
        members: prev.members.filter((m) => m.id !== id),
        chores: updatedChores,
      }));
    });

    es.addEventListener('chore:add', (e) => {
      const chore = JSON.parse(e.data) as Chore;
      patch((prev) => ({ ...prev, chores: [...prev.chores, chore] }));
    });

    es.addEventListener('chore:update', (e) => {
      const chore = JSON.parse(e.data) as Chore;
      patch((prev) => ({
        ...prev,
        chores: prev.chores.map((c) => (c.id === chore.id ? chore : c)),
      }));
    });

    es.addEventListener('chore:remove', (e) => {
      const { id } = JSON.parse(e.data) as { id: string };
      patch((prev) => ({
        ...prev,
        chores: prev.chores.filter((c) => c.id !== id),
        completions: prev.completions.filter((c) => c.choreId !== id),
      }));
    });

    es.addEventListener('completion:toggle', (e) => {
      const { action, completion } = JSON.parse(e.data) as {
        action: 'added' | 'removed';
        completion: Completion;
      };
      patch((prev) => {
        if (action === 'added') {
          return { ...prev, completions: [...prev.completions, completion] };
        }
        return {
          ...prev,
          completions: prev.completions.filter(
            (c) => !(c.choreId === completion.choreId && c.date === completion.date),
          ),
        };
      });
    });

    es.onerror = () => {
      es.addEventListener(
        'open',
        () => {
          queryClient.invalidateQueries({ queryKey: STATE_KEY });
        },
        { once: true },
      );
    };

    return () => es.close();
  }, [queryClient]);

  // --- Mutations ---

  const addMemberMutation = useMutation({
    mutationFn: (member: Omit<Member, 'id'>) =>
      post('/api/members', { ...member, id: crypto.randomUUID() }),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/members/${id}`, { method: 'DELETE' }),
  });

  const addChoreMutation = useMutation({
    mutationFn: (chore: Omit<Chore, 'id'>) =>
      post('/api/chores', { ...chore, id: crypto.randomUUID() }),
  });

  const updateChoreMutation = useMutation({
    mutationFn: (chore: Chore) =>
      fetch(`/api/chores/${chore.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chore),
      }),
  });

  const removeChoreMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/chores/${id}`, { method: 'DELETE' }),
  });

  const toggleCompletionMutation = useMutation({
    mutationFn: ({
      choreId,
      date,
    }: {
      choreId: string;
      date: string;
    }) =>
      post('/api/completions/toggle', {
        id: crypto.randomUUID(),
        choreId,
        date,
        completedAt: new Date().toISOString(),
      }),
  });

  // --- Action wrappers (same signatures as before) ---

  const addMember = useCallback(
    (member: Omit<Member, 'id'>) => addMemberMutation.mutate(member),
    [addMemberMutation],
  );

  const removeMember = useCallback(
    (id: string) => removeMemberMutation.mutate(id),
    [removeMemberMutation],
  );

  const addChore = useCallback(
    (chore: Omit<Chore, 'id'>) => addChoreMutation.mutate(chore),
    [addChoreMutation],
  );

  const updateChore = useCallback(
    (chore: Chore) => updateChoreMutation.mutate(chore),
    [updateChoreMutation],
  );

  const removeChore = useCallback(
    (id: string) => removeChoreMutation.mutate(id),
    [removeChoreMutation],
  );

  const toggleCompletion = useCallback(
    (choreId: string, date: string) =>
      toggleCompletionMutation.mutate({ choreId, date }),
    [toggleCompletionMutation],
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
    loading: isLoading,
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
