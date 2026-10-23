import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CheckSquare,
  CalendarDays,
  Wallet,
  StickyNote,
  Target,
  Settings,
  CircleHelp,
  Command,
} from "lucide-react";

const logo = {
  dark: "/public/dark_logo.png",
  light: "/public/light_logo.png",
};

const navigation = [
  { label: "Overview", icon: LayoutDashboard, path: "/" },
  { label: "My Tasks", icon: CheckSquare, path: "/tasks" },
  { label: "Calendar", icon: CalendarDays, path: "/calendar" },
  { label: "Finance", icon: Wallet, path: "/finance" },
  { label: "Notes", icon: StickyNote, path: "/notes" },
  { label: "Habits", icon: Target, path: "/habits" },
];

function Sidebar({ onNavigate }) {
  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
      isActive
        ? "bg-brand-50 text-brand-700"
        : "text-slate-600 hover:bg-slate-50 hover:text-ink"
    }`;

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-6">
      <div className="mb-10 flex items-center gap-3 px-2">
        <img
          src={logo.light}
          alt="OneSphere logo"
          className="h-10 w-10 rounded-lg shrink-0 object-contain"
        />

        <div>
          <h1 className="text-lg font-bold text-indigo-500 ">OneSphere</h1>
          <p className="text-xs text-muted">Your world, organized.</p>
        </div>
      </div>

      <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Workspace
      </p>

      <nav className="space-y-1">
        {navigation.map(({ label, icon: Icon, path }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            onClick={onNavigate}
            className={linkClass}
          >
            <Icon size={19} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-1 border-t border-slate-100 pt-4">
        <NavLink to="/settings" onClick={onNavigate} className={linkClass}>
          <Settings size={19} />
          Settings
        </NavLink>
        <NavLink to="/help" onClick={onNavigate} className={linkClass}>
          <CircleHelp size={19} />
          Help and support
        </NavLink>
      </div>

      <div className="mt-5 rounded-xl bg-slate-50 p-3">
        <p className="text-sm font-semibold text-ink">Your space, your pace.</p>
        <p className="mt-1 text-xs leading-5 text-muted">
          Bring your everyday plans together in one place.
        </p>
      </div>
    </aside>
  );
}

export default Sidebar;
