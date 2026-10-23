
import { Bell, Search, Plus, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function Topbar({ onMenuClick }) {
  const navigate = useNavigate();

  return (
    <header className="flex min-h-20 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          aria-label="Open navigation"
          onClick={onMenuClick}
          className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          <Menu size={21} />
        </button>

        <div className="relative w-full max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            aria-label="Search workspace"
            placeholder="Search your workspace..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white"
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => navigate('/tasks')}
          className="hidden items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 sm:flex"
        >
          <Plus size={18} />
          Create new
        </button>

        <button
          type="button"
          aria-label="Notifications"
          onClick={() => navigate('/notifications')}
          className="relative rounded-xl p-2.5 text-slate-600 hover:bg-slate-100"
        >
          <Bell size={20} />
        </button>

        <div
          title="My workspace"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700"
        >
          O
        </div>
      </div>
    </header>
  );
}

export default Topbar;
