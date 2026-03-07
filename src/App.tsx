import { useState } from 'react';
import { useStore } from './store/useStore';
import MonthView from './components/CalendarView/MonthView';
import Sidebar from './components/Sidebar';
import ChoreModal from './components/Modals/ChoreModal';
import TeamModal from './components/Modals/TeamModal';
import type { Chore } from './types';

export default function App() {
  const store = useStore();
  const [choreModalOpen, setChoreModalOpen] = useState(false);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [editingChore, setEditingChore] = useState<Chore | null>(null);

  function openAddChore() {
    setEditingChore(null);
    setChoreModalOpen(true);
  }

  function openEditChore(chore: Chore) {
    setEditingChore(chore);
    setChoreModalOpen(true);
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar
        members={store.members}
        onAddChore={openAddChore}
        onManageTeam={() => setTeamModalOpen(true)}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <MonthView
          chores={store.chores}
          members={store.members}
          isCompleted={store.isCompleted}
          onToggleDone={store.toggleCompletion}
          onEditChore={openEditChore}
        />
      </main>

      <ChoreModal
        open={choreModalOpen}
        onClose={() => setChoreModalOpen(false)}
        members={store.members}
        initial={editingChore}
        onSave={(data) => {
          if (editingChore) {
            store.updateChore({ ...data, id: editingChore.id });
          } else {
            store.addChore(data);
          }
        }}
        onDelete={editingChore ? () => store.removeChore(editingChore.id) : undefined}
      />

      <TeamModal
        open={teamModalOpen}
        onClose={() => setTeamModalOpen(false)}
        members={store.members}
        onAdd={store.addMember}
        onRemove={store.removeMember}
      />
    </div>
  );
}
