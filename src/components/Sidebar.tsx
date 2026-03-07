import type { Member } from '../types';
import { getInitials } from '../utils/colors';

interface Props {
  members: Member[];
  onAddChore: () => void;
  onManageTeam: () => void;
}

export default function Sidebar({ members, onAddChore, onManageTeam }: Props) {
  return (
    <aside className="w-56 shrink-0 bg-gray-50 border-r border-gray-200 flex flex-col p-4 gap-3">
      <h1 className="text-xl font-bold text-gray-800 mb-2">Office Chores</h1>

      <button
        onClick={onAddChore}
        className="w-full bg-blue-600 text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-blue-700 text-left"
      >
        + Add Chore
      </button>

      <button
        onClick={onManageTeam}
        className="w-full bg-white text-gray-700 text-sm font-medium rounded-lg px-4 py-2 hover:bg-gray-100 border border-gray-200 text-left"
      >
        Manage Team
      </button>

      {members.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Team</p>
          <div className="flex flex-col gap-2">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ backgroundColor: m.color }}
                >
                  {getInitials(m.name)}
                </div>
                <span className="text-sm text-gray-700 truncate">{m.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
