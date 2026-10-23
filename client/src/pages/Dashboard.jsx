
import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock3,
  CalendarDays,
  TrendingUp,
  Plus,
  X,
} from 'lucide-react';

const initialTasks = [
  { id: 1, title: 'Review project milestones', category: 'Work', done: true },
  { id: 2, title: 'Plan the week ahead', category: 'Personal', done: false },
  { id: 3, title: 'Organize project notes', category: 'Work', done: false },
];

function loadTasks() {
  try {
    const savedTasks = localStorage.getItem('onesphere-demo-tasks');
    return savedTasks ? JSON.parse(savedTasks) : initialTasks;
  } catch {
    return initialTasks;
  }
}

function Dashboard() {
  const [tasks, setTasks] = useState(loadTasks);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Personal');

  useEffect(() => {
    localStorage.setItem('onesphere-demo-tasks', JSON.stringify(tasks));
  }, [tasks]);

  function addTask(event) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    setTasks((currentTasks) => [
      {
        id: `${Date.now()}-${Math.random()}`,
        title: trimmedTitle,
        category,
        done: false,
      },
      ...currentTasks,
    ]);

    setTitle('');
    setCategory('Personal');
    setShowForm(false);
  }

  function toggleTask(id) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task
      )
    );
  }

  const completedCount = tasks.filter((task) => task.done).length;
  const pendingCount = tasks.length - completedCount;

  const stats = [
    {
      label: 'Tasks completed',
      value: completedCount,
      detail: 'Completed tasks',
      icon: CheckCircle2,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Tasks remaining',
      value: pendingCount,
      detail: 'Still on your list',
      icon: Clock3,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Upcoming events',
      value: '3',
      detail: 'Sample dashboard data',
      icon: CalendarDays,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Task progress',
      value: tasks.length
        ? `${Math.round((completedCount / tasks.length) * 100)}%`
        : '0%',
      detail: 'Based on your task list',
      icon: TrendingUp,
      color: 'bg-violet-50 text-violet-600',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-brand-600">
            Your personal workspace
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink">
            Welcome back!
          </h2>
          <p className="mt-2 text-sm text-muted">
            Here's a snapshot of what's happening in your world.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm((current) => !current)}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? 'Cancel' : 'Add a task'}
        </button>
      </section>

      {showForm && (
        <form
          onSubmit={addTask}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card"
        >
          <h3 className="font-semibold text-ink">Create a task</h3>

          <label
            htmlFor="task-title"
            className="mt-4 block text-sm font-medium text-slate-700"
          >
            Task name
          </label>
          <input
            id="task-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What do you need to do?"
            maxLength={150}
            required
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-500"
          />

          <label
            htmlFor="task-category"
            className="mt-4 block text-sm font-medium text-slate-700"
          >
            Category
          </label>
          <select
            id="task-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500 sm:max-w-xs"
          >
            <option>Personal</option>
            <option>Work</option>
            <option>Study</option>
          </select>

          <button
            type="submit"
            className="mt-5 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Save task
          </button>
        </form>
      )}

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, detail, icon: Icon, color }) => (
          <article
            key={label}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card"
          >
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}
            >
              <Icon size={21} />
            </div>
            <p className="mt-5 text-sm text-muted">{label}</p>
            <p className="mt-1 text-3xl font-bold text-ink">{value}</p>
            <p className="mt-2 text-xs text-slate-400">{detail}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-ink">My tasks</h3>
              <p className="mt-1 text-sm text-muted">
                Select a task to change its completion status.
              </p>
            </div>
            <span className="rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700">
              {pendingCount} left
            </span>
          </div>

          <div className="mt-5 divide-y divide-slate-100">
            {tasks.map((task) => (
              <label
                key={task.id}
                className="flex cursor-pointer items-center gap-3 py-4"
              >
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => toggleTask(task.id)}
                  className="h-4 w-4 accent-indigo-600"
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={`break-words text-sm font-medium ${
                      task.done
                        ? 'text-slate-400 line-through'
                        : 'text-ink'
                    }`}
                  >
                    {task.title}
                  </p>
                  <p className="mt-1 text-xs text-muted">{task.category}</p>
                </div>
              </label>
            ))}

            {tasks.length === 0 && (
              <p className="py-8 text-center text-sm text-muted">
                No tasks yet. Add your first task to get started.
              </p>
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card">
          <div className="flex items-center gap-3">
            <CalendarDays size={22} className="text-brand-600" />
            <div>
              <h3 className="text-lg font-bold text-ink">Coming up</h3>
              <p className="text-sm text-muted">Preview of your schedule</p>
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-slate-50 p-4">
            <p className="text-sm font-semibold text-ink">Your calendar awaits</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Calendar events will be added in a later phase. The event counts
              elsewhere on this dashboard are still sample data.
            </p>
          </div>
        </article>
      </section>
    </div>
  );
}

export default Dashboard;
