import { useState } from 'react';
import { addMonths, subMonths } from 'date-fns';
import { useStore } from './store/useStore';
import MonthView from './components/CalendarView/MonthView';
import YearView from './components/CalendarView/YearView';
import Sidebar from './components/Sidebar';
import ChoreModal from './components/Modals/ChoreModal';
import TeamModal from './components/Modals/TeamModal';
import type { Chore } from './types';

export default function App() {
  const store = useStore();
  const [choreModalOpen, setChoreModalOpen] = useState(false);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [editingChore, setEditingChore] = useState<Chore | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  function openAddChore() {
    setEditingChore(null);
    setChoreModalOpen(true);
  }

  function openEditChore(chore: Chore) {
    setEditingChore(chore);
    setChoreModalOpen(true);
  }

  function navigateMonth(direction: 'prev' | 'next') {
    setCurrentMonth((m) => direction === 'prev' ? subMonths(m, 1) : addMonths(m, 1));
  }

  function navigateYear(direction: 'prev' | 'next') {
    setCurrentMonth((m) => {
      const year = m.getFullYear() + (direction === 'prev' ? -1 : 1);
      return new Date(year, m.getMonth(), 1);
    });
  }

  function handleSelectMonth(date: Date) {
    setCurrentMonth(date);
    setViewMode('month');
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar
        members={store.members}
        onAddChore={openAddChore}
        onManageTeam={() => setTeamModalOpen(true)}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {viewMode === 'month' ? (
          <MonthView
            chores={store.chores}
            members={store.members}
            currentMonth={currentMonth}
            onNavigate={navigateMonth}
            onSwitchToYear={() => setViewMode('year')}
            isCompleted={store.isCompleted}
            onToggleDone={store.toggleCompletion}
            onEditChore={openEditChore}
            onToggleAssignee={store.toggleAssignee}
          />
        ) : (
          <YearView
            chores={store.chores}
            currentYear={currentMonth.getFullYear()}
            onNavigateYear={navigateYear}
            onSelectMonth={handleSelectMonth}
            onSwitchToMonth={() => setViewMode('month')}
          />
        )}
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
